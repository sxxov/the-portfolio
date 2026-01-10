<?php

namespace app\monkey\embed_self;

// register this site as a trusted oembed provider for itself
add_action('init', function () {
	$site_url = site_url();
	$site_url_escaped = preg_quote($site_url, '#');
	$pattern =  "#^$site_url_escaped/*#i";

	// wp native oembed endpoint for this site
	$endpoint = $site_url . '/wp-json/oembed/1.0/embed';

	wp_oembed_add_provider(
		$pattern,
		$endpoint,
		true
	);
});

// remove `sandbox` attribute from iframes embedding same-origin URLs
add_filter('render_block_core/embed', function (string $block_content, array $block) {
	if (!$block_content || !str_contains($block_content, '<iframe'))
		return $block_content;

	$processor = new \WP_HTML_Tag_Processor($block_content);
	$changed = false;

	while ($processor->next_tag('iframe')) {
		$src = $processor->get_attribute('src');
		if (!$src) continue;

		$src_host = wp_parse_url($src, PHP_URL_HOST);
		if (!$src_host) continue;

		$site_host = wp_parse_url(home_url(), PHP_URL_HOST);
		if ($src_host !== $site_host) continue;

		$processor->remove_attribute('sandbox');
		$changed = true;
	}

	return $changed ? $processor->get_updated_html() : $block_content;
}, 10, 2);

add_filter('embed_template', function ($template, $type, $templates) {
	add_action('wp_head', function () {
		if (!headers_sent())
			header('x-wp-embed: true');

		do_action('embed_head');
	});
	add_action('wp_footer', function () {
		do_action('embed_footer');
	});
	return locate_block_template('', $type, $templates) ?: $template;
}, 10, 3);
