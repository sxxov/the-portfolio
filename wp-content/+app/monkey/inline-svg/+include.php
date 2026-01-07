<?php

namespace app\monkey\inline_svg;

use WP_HTML_Tag_Processor;

add_filter('render_block_core/image', function (string $block_content, array $block) {
	$attachment_id = $block['attrs']['id'] ?? null;
	if (!$attachment_id) return $block_content;

	$mime = get_post_mime_type($attachment_id);
	if ($mime !== 'image/svg+xml') return $block_content;

	$path = get_attached_file($attachment_id);
	if (!$path || !is_readable($path)) return $block_content;

	$svg_content = file_get_contents($path);
	if ($svg_content === false) return $block_content;

	$processor = new WP_HTML_Tag_Processor($block_content);
	$processor->next_tag('img');
	$attribute_names = $processor->get_attribute_names_with_prefix('') ?? [];
	$attributes = [];
	foreach ($attribute_names as $name)
		$attributes[$name] = $processor->get_attribute($name);

	return get_svg_as_html(
		$svg_content,
		$attributes
	);
}, 10, 2);

function get_svg_as_html(string $svg, array $attribute_overrides) {
	$prev = libxml_use_internal_errors(true);

	$dom = new \DOMDocument();

	// NONET: block network fetching. The others just silence warnings.
	$opts = LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING;

	if (!$dom->loadXML($svg, $opts)) {
		libxml_clear_errors();
		libxml_use_internal_errors($prev);
		return $svg;
	}

	$root = $dom->documentElement;
	if (!$root || strtolower($root->tagName) !== 'svg') {
		libxml_use_internal_errors($prev);
		return $svg;
	}

	// Ensure xmlns exists (HTML inline SVG still expects it in practice)
	if (!$root->hasAttribute('xmlns')) {
		$root->setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	}

	// Apply attribute overrides
	foreach ($attribute_overrides as $k => $v) {
		if ($v === null || $v === '') continue;
		$root->setAttribute($k, (string) $v);
	}

	// Optional: normalize xlink:href => href (SVG2)
	// Keep xlink namespace if you want, but inline HTML generally prefers href.
	$xpath = new \DOMXPath($dom);
	$xpath->registerNamespace('xlink', 'http://www.w3.org/1999/xlink');
	foreach ($xpath->query('//*[@xlink:href]') as $el) {
		/** @var DOMElement $el */
		$val = $el->getAttributeNS('http://www.w3.org/1999/xlink', 'href');
		if ($val !== '') $el->setAttribute('href', $val);
		$el->removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
	}

	// Hard strip scripts + event handlers (good baseline safety)
	foreach (
		iterator_to_array(
			$dom->getElementsByTagName('script')
		) as $node
	) {
		$node->parentNode?->removeChild($node);
	}
	foreach ($xpath->query('//@*[starts-with(name(), "on")]') as $attr) {
		/** @var \DOMAttr $attr */
		$attr->ownerElement?->removeAttributeNode($attr);
	}

	// Serialize ONLY <svg ...>...</svg> (no XML header, no doctype)
	$out = $dom->saveXML($root);

	libxml_use_internal_errors($prev);
	return $out ?: $svg;
}
