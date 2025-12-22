<?php

namespace app\monkey\always_run_shortcode_block;

add_filter('render_block_core/shortcode', function (
	string $block_content,
	array $block,
	?\WP_Block $instance,
) {
	return do_shortcode($block_content);
}, 10, 3);
