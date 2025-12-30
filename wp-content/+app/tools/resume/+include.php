<?php

namespace app\tools\resume;

add_action('template_redirect', function () {
	if (is_admin() || wp_doing_ajax() || wp_doing_cron())
		return;
	if (!function_exists('get_field'))
		return;

	$resume = get_field('resume', 'option');
	if (!is_array($resume)) return;

	$hook = $resume['hook'] ?? null;
	$file = $resume['file'] ?? null;
	if (!is_string($hook) || !$file) return;

	$site_url = site_url();

	/** @var string[]|false */
	$site_location = wp_parse_url($site_url);
	if (!$site_location) return;

	$site_host = $site_location['host'] ?? null;
	if (!$site_host) return;

	/** @var string[]|false */
	$hook_url = wp_parse_url($hook);
	if (!$hook_url) return;

	$hook_host = $hook_url['host'] ?? $site_host;
	$hook_path = $hook_url['path'] ?? null;
	if (!$hook_path) return;

	/** @var string[]|false */
	$location_url = wp_parse_url($_SERVER['REQUEST_URI']);
	if (!$location_url) return;

	$location_host = $location_url['host'] ?? $site_host;
	$location_path = $location_url['path'] ?? null;
	if (!$location_path) return;

	if (
		strtolower($hook_host) !== strtolower($location_host) ||
		untrailingslashit(
			strtolower($hook_path)
		) !== untrailingslashit(
			strtolower($location_path)
		)
	)
		return;

	$attachment_id = $file['id'];
	if (!$attachment_id) goto fallback;

	$attachment = get_post($attachment_id);
	if (!$attachment) goto fallback;

	$filename = $file['filename'] ?? '';
	$filename = sanitize_file_name($filename);
	$filename = $filename ?: 'resume.pdf';

	$mime_type = $file['mime_type'] ?? null;
	if ($mime_type !== 'application/pdf') goto fallback;

	$attachment_path = get_attached_file($attachment_id);
	if (!$attachment_path || !is_readable($attachment_path)) goto fallback;

	$pdf = file_get_contents($attachment_path);
	if ($pdf === false) goto fallback;

	$location_query = $location_url['query'] ?? '';
	parse_str($location_query, $query_vars);

	$utm_source = $query_vars['utm_source'] ?? '';
	$utm_source = sanitize_text_field(wp_unslash($utm_source));
	if (!$utm_source) {
		$body = $pdf;
		goto ok;
	}

	$body = add_utm_source_to_pdf_links(
		$pdf,
		$site_url,
		$utm_source,
	);
	if (!$body) goto fallback;

	if (headers_sent()) goto finalize;

	goto ok;

	ok: {
		header('content-type: application/pdf');
		header('content-length: ' . strlen($body));
		header("content-disposition: inline; filename=\"$filename\"");
		echo $body;
		goto finalize;
	}

	fallback: {
		if (headers_sent()) goto finalize;

		status_header(308);
		header('location: ' . $file['url']);
		goto finalize;
	}

	finalize: {
		die;
	}
});

function add_utm_source_to_pdf_links(
	string $pdf,
	string $site_url,
	string $utm_source,
) {
	$updates = get_pdf_uri_object_updates(
		$pdf,
		$site_url,
		$utm_source,
	);
	if (!$updates) return $pdf;

	$trailer = get_pdf_trailer_info($pdf);
	if (!$trailer) return;

	$append = "\n";
	$updated_objects = $append;
	$offsets = [];

	foreach ($updates as $obj_num => $obj) {
		$offset = strlen($pdf) + strlen($updated_objects);
		$updated_objects .= $obj_num . ' ' . $obj['gen'] . " obj\n"
			. $obj['content'] . "\nendobj\n";
		$offsets[$obj_num] = [
			'offset' => $offset,
			'gen' => $obj['gen'],
		];
	}

	$xref_offset = strlen($pdf) + strlen($updated_objects);
	$xref = build_pdf_xref($offsets);

	$max_obj_num = max(array_keys($offsets));
	$base_size = $trailer['size'] ?: ($max_obj_num + 1);
	$new_size = max($base_size, $max_obj_num + 1);
	$updated_trailer = update_pdf_trailer(
		$trailer['trailer'],
		$new_size,
		$trailer['startxref'],
	);

	return $pdf
		. $updated_objects
		. $xref
		. "trailer\n"
		. $updated_trailer
		. "\nstartxref\n"
		. $xref_offset
		. "\n%%EOF";
}

function get_pdf_uri_object_updates(
	string $pdf,
	string $site_url,
	string $utm_source,
) {
	$matches = [];
	$match_count = preg_match_all(
		'/(\d+)\s+(\d+)\s+obj\b/',
		$pdf,
		$matches,
		PREG_OFFSET_CAPTURE,
	);
	if ($match_count === false || $match_count === 0)
		return [];

	$site_parts = wp_parse_url($site_url);
	$site_host = strtolower($site_parts['host'] ?? '');
	if ($site_host === '')
		return [];

	$updates = [];
	$pdf_len = strlen($pdf);
	for ($i = 0; $i < $match_count; $i++) {
		$obj_num = (int) $matches[1][$i][0];
		$gen = (int) $matches[2][$i][0];
		$header = $matches[0][$i];
		$body_start = $header[1] + strlen($header[0]);
		$next_start = ($i + 1 < $match_count)
			? $matches[0][$i + 1][1]
			: $pdf_len;
		$end = strpos($pdf, 'endobj', $body_start);
		if ($end === false || $end > $next_start)
			continue;

		$body = substr($pdf, $body_start, $end - $body_start);

		if (strpos($body, '/URI') === false)
			continue;

		$did_update = false;
		$updated_body = preg_replace_callback(
			'/(\/URI\s*)(\((?:\\\\.|[^\\\\\)])*\)|<[\da-fA-F\s]+>)/s',
			function (array $m) use (
				$site_host,
				$utm_source,
				&$did_update,
			) {
				$url = parse_pdf_uri_string($m[2]);
				if ($url === null)
					return $m[0];
				if (!is_site_url($url, $site_host))
					return $m[0];

				$updated_url = add_utm_source_to_url(
					$url,
					$utm_source,
				);
				if ($updated_url === $url)
					return $m[0];

				$did_update = true;
				return $m[1] . encode_pdf_literal_string($updated_url);
			},
			$body,
		);

		if (!$did_update || $updated_body === null)
			continue;

		$updates[$obj_num] = [
			'gen' => $gen,
			'content' => $updated_body,
		];
	}

	return $updates;
}

function parse_pdf_uri_string(string $raw): ?string {
	$raw = trim($raw);
	if ($raw === '')
		return null;

	if ($raw[0] === '(' && str_ends_with($raw, ')')) {
		$value = substr($raw, 1, -1);
		return decode_pdf_literal_string($value);
	}

	if ($raw[0] === '<' && str_ends_with($raw, '>')) {
		$value = substr($raw, 1, -1);
		return decode_pdf_hex_string($value);
	}

	return null;
}

function is_site_url(string $url, string $site_host): bool {
	$parts = wp_parse_url($url);
	if (!is_array($parts) || empty($parts['host']))
		return false;

	return strtolower($parts['host']) === $site_host;
}

function add_utm_source_to_url(string $url, string $utm_source): string {
	$parts = wp_parse_url($url);
	if (!is_array($parts))
		return $url;

	$query = [];
	if (!empty($parts['query']))
		parse_str($parts['query'], $query);

	$query['utm_source'] = $utm_source;
	$parts['query'] = http_build_query(
		$query,
		'',
		'&',
		PHP_QUERY_RFC3986,
	);

	return build_url($parts);
}

function build_url(array $parts): string {
	$scheme = isset($parts['scheme'])
		? $parts['scheme'] . '://'
		: '';
	$user = $parts['user'] ?? '';
	$pass = $parts['pass'] ?? '';
	$auth = $user !== ''
		? $user . ($pass !== '' ? ':' . $pass : '') . '@'
		: '';
	$host = $parts['host'] ?? '';
	$port = isset($parts['port']) ? ':' . $parts['port'] : '';
	$path = $parts['path'] ?? '';
	$query = $parts['query'] ?? '';
	$fragment = $parts['fragment'] ?? '';

	return $scheme
		. $auth
		. $host
		. $port
		. $path
		. ($query !== '' ? '?' . $query : '')
		. ($fragment !== '' ? '#' . $fragment : '');
}

function decode_pdf_literal_string(string $value): string {
	$out = '';
	$len = strlen($value);
	for ($i = 0; $i < $len; $i++) {
		$ch = $value[$i];
		if ($ch !== '\\') {
			$out .= $ch;
			continue;
		}

		$i++;
		if ($i >= $len)
			break;

		$esc = $value[$i];
		if ($esc === "\r") {
			if ($i + 1 < $len && $value[$i + 1] === "\n")
				$i++;
			continue;
		}
		if ($esc === "\n")
			continue;

		if ($esc >= '0' && $esc <= '7') {
			$oct = $esc;
			for (
				$j = 0;
				$j < 2 && $i + 1 < $len
					&& $value[$i + 1] >= '0'
					&& $value[$i + 1] <= '7';
				$j++
			) {
				$oct .= $value[++$i];
			}
			$out .= chr(octdec($oct));
			continue;
		}

		$out .= match ($esc) {
			'n' => "\n",
			'r' => "\r",
			't' => "\t",
			'b' => "\b",
			'f' => "\f",
			'\\' => '\\',
			'(' => '(',
			')' => ')',
			default => $esc,
		};
	}

	return $out;
}

function decode_pdf_hex_string(string $value): ?string {
	$clean = preg_replace('/\s+/', '', $value);
	if ($clean === null || $clean === '')
		return null;

	if (strlen($clean) % 2 === 1)
		$clean .= '0';

	$decoded = hex2bin($clean);
	return $decoded === false ? null : $decoded;
}

function encode_pdf_literal_string(string $value): string {
	$out = '';
	$len = strlen($value);
	for ($i = 0; $i < $len; $i++) {
		$ch = $value[$i];
		$ord = ord($ch);

		$out .= match ($ch) {
			'\\' => '\\\\',
			'(' => '\\(',
			')' => '\\)',
			"\n" => '\\n',
			"\r" => '\\r',
			"\t" => '\\t',
			"\b" => '\\b',
			"\f" => '\\f',
			default => ($ord < 32 || $ord > 126)
				? '\\' . str_pad(decoct($ord), 3, '0', STR_PAD_LEFT)
				: $ch,
		};
	}

	return '(' . $out . ')';
}

function get_pdf_trailer_info(string $pdf): ?array {
	$startxref_matches = [];
	if (!preg_match_all(
		'/startxref\s+(\d+)\s+%%EOF/s',
		$pdf,
		$startxref_matches,
	))
		return null;

	$startxref = (int) end($startxref_matches[1]);

	$trailer_matches = [];
	if (!preg_match_all(
		'/trailer\s*(<<.*?>>)\s*startxref/s',
		$pdf,
		$trailer_matches,
	))
		return null;

	$trailer = end($trailer_matches[1]);
	$size = null;
	if (preg_match('/\/Size\s+(\d+)/', $trailer, $size_match))
		$size = (int) $size_match[1];

	return [
		'trailer' => $trailer,
		'startxref' => $startxref,
		'size' => $size,
	];
}

function build_pdf_xref(array $offsets): string {
	ksort($offsets);

	$xref = "xref\n";
	$xref .= "0 1\n0000000000 65535 f \n";

	$nums = array_keys($offsets);
	$range = [];
	$last = null;

	foreach ($nums as $num) {
		if ($last !== null && $num !== $last + 1) {
			$xref .= build_pdf_xref_range($range, $offsets);
			$range = [];
		}
		$range[] = $num;
		$last = $num;
	}

	if ($range)
		$xref .= build_pdf_xref_range($range, $offsets);

	return $xref;
}

function build_pdf_xref_range(array $range, array $offsets): string {
	$start = $range[0];
	$out = $start . ' ' . count($range) . "\n";
	foreach ($range as $num) {
		$offset = $offsets[$num]['offset'];
		$gen = $offsets[$num]['gen'];
		$out .= sprintf("%010d %05d n \n", $offset, $gen);
	}
	return $out;
}

function update_pdf_trailer(string $trailer, int $size, int $prev): string {
	$updated = $trailer;

	$updated = preg_replace(
		'/\/Size\s+\d+/',
		'/Size ' . $size,
		$updated,
		1,
		$size_count,
	);
	if (($size_count ?? 0) === 0) {
		$updated = preg_replace(
			'/<<\s*/',
			'<< /Size ' . $size . ' ',
			$updated,
			1,
		);
	}

	$updated = preg_replace(
		'/\/Prev\s+\d+/',
		'/Prev ' . $prev,
		$updated,
		1,
		$prev_count,
	);
	if (($prev_count ?? 0) === 0) {
		$updated = preg_replace(
			'/>>\s*$/',
			"/Prev $prev\n>>",
			$updated,
			1,
		);
	}

	return $updated;
}
