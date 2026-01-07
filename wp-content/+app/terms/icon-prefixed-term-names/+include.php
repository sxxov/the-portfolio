<?php

namespace app\terms\icon_prefixed_term_names;

const PREFIX_PATTERN = '/(?<prefix>\\w+):\\s*/';

add_filter('render_block_core/term-name', function (
	string $block_content,
	array $block,
) {
	$icons = get_icons();
	if (!$icons) return $block_content;

	$updated = replace_term_prefixes_with_icons($block_content, $icons);

	return $updated ?? $block_content;
}, 10, 2);

function get_icons() {
	/** @var ?array<string,array> */
	static $icons = null;
	if ($icons !== null) return $icons;

	$icons = [];

	if (!function_exists('get_field')) return $icons;

	$taxonomy = get_field('taxonomy', 'options');
	if (!is_array($taxonomy)) return $icons;

	/** @var ?array<int,array{prefix:string,icon:array}> */
	$rows = $taxonomy['icons'] ?? null;
	if (!is_array($rows)) return $icons;

	foreach ($rows as $row) {
		if (!is_array($row)) continue;

		$prefix = $row['prefix'] ?? null;
		$icon = $row['icon'] ?? null;
		if (!$prefix || !$icon) continue;

		$id = trim((string) $prefix);
		$id = strtolower($id);
		if ($id === '') continue;

		$icons[$id] = $icon;
	}

	return $icons;
}

function get_icon_html(array $icon, string $prefix) {
	$mime_type = $icon['mime_type'] ?? null;
	if (
		!is_string($mime_type) ||
		!str_starts_with($mime_type, 'image/')
	)
		return;

	$attachment_id = $icon['id'] ?? null;
	if (!is_numeric($attachment_id) || !$attachment_id)
		return;
	$attachment_id = (int) $attachment_id;

	$url = $icon['url'] ?? null;
	if (!is_string($url) || !$url)
		return;

	$block = <<<HTML
		<!-- wp:image {"id":$attachment_id,"url":"$url","alt":"$prefix","sizeSlug":"full"} -->
		<figure class="wp-block-image size-full">
			<img src="$url" alt="$prefix" class="wp-image-$attachment_id"/>
		</figure>
		<!-- /wp:image -->
		HTML;
	$html = do_blocks($block);

	return $html ?: '';
}

function replace_term_prefixes_with_icons(
	string $block_content,
	array $icons,
) {
	$dom = new \DOMDocument('1.0', 'UTF-8');
	$did_replace = false;

	$prev = libxml_use_internal_errors(true);
	$dom->loadHTML(
		'<main>' . $block_content . '</main>',
		LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
	);
	libxml_clear_errors();
	libxml_use_internal_errors($prev);

	$root = $dom->getElementsByTagName('main')->item(0);
	if (!$root) return $block_content;

	$xpath = new \DOMXPath($dom);
	$text_nodes = $xpath->query('.//text()', $root);
	if (!$text_nodes) return $block_content;

	foreach (iterator_to_array($text_nodes) as $text_node) {
		$text = $text_node->nodeValue;
		if (!is_string($text) || trim($text) === '')
			continue;

		$matches = [];
		$matched = preg_match(
			PREFIX_PATTERN,
			$text,
			$matches,
			PREG_OFFSET_CAPTURE,
		);
		if (!$matched) continue;

		$prefix_match = $matches['prefix'][0] ?? null;
		if ($prefix_match === null) continue;

		$icon = $icons[strtolower($prefix_match)] ?? null;
		if (!$icon) continue;

		$icon_html = get_icon_html($icon, $prefix_match);
		if ($icon_html === '') continue;

		$wrapper = create_icon_wrapper_node($dom, $icon_html);
		if (!$wrapper) continue;

		$match_text = $matches[0][0];
		$match_offset = $matches[0][1];

		$before = substr($text, 0, $match_offset);
		$after = substr(
			$text,
			$match_offset + strlen($match_text)
		);

		$parent = $text_node->parentNode;
		if (!$parent) continue;

		if ($before !== '')
			$parent->insertBefore(
				$dom->createTextNode($before),
				$text_node
			);

		$parent->insertBefore($wrapper, $text_node);

		if ($after !== '')
			$parent->insertBefore(
				$dom->createTextNode($after),
				$text_node
			);

		$parent->removeChild($text_node);
		$did_replace = true;
	}

	if (!$did_replace) return $block_content;

	return get_dom_inner_html($root);
}

function create_icon_wrapper_node(\DOMDocument $dom, string $icon_html) {
	$fragment = parse_html_fragment($dom, $icon_html);
	if (!$fragment) return;

	$wrapper = $dom->createElement('span');
	$wrapper->setAttribute('class', 'term-prefix-icon');
	$wrapper->appendChild($fragment);
	if (!$wrapper) return;

	return $wrapper;
}

function parse_html_fragment(\DOMDocument $dom, string $html) {
	$tmp = new \DOMDocument('1.0', 'UTF-8');

	$prev = libxml_use_internal_errors(true);
	$tmp->loadHTML(
		'<main>' . $html . '</main>',
		LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
	);
	libxml_clear_errors();
	libxml_use_internal_errors($prev);

	$root = $tmp->getElementsByTagName('main')->item(0);
	if (!$root) return;

	$fragment = $dom->createDocumentFragment();
	if (!$fragment) return;

	foreach (iterator_to_array($root->childNodes) as $child)
		$fragment->appendChild($dom->importNode($child, true));

	return $fragment;
}

function get_dom_inner_html(\DOMNode $node) {
	$dom = $node->ownerDocument;
	$html = '';
	foreach (iterator_to_array($node->childNodes) as $child)
		$html .= $dom->saveHTML($child);

	return $html;
}
