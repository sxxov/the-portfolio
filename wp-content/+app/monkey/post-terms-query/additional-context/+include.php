<?php

namespace app\monkey\post_terms_query\additional_context;

use function bare\module\client\enqueue_script_type_module;
use function bare\utilities\url\get_uri;

add_action('enqueue_block_editor_assets', function () {
	$handle = __NAMESPACE__ . '/additional-context';
	$path = __DIR__ . '/index.js';
	wp_enqueue_script(
		$handle,
		get_uri($path),
		ver: filemtime($path),
	);
	enqueue_script_type_module($handle);
});

add_filter('register_block_type_args', function ($args, $name) {
	if ('core/terms-query' === $name)
		$args['uses_context'][] = 'postId';

	return $args;
}, 10, 2);
