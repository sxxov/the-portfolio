<?php

namespace app\monkey\contact_form_7_gutenberg;

use function bare\utilities\editor\sniff_post_id;

add_filter(
	'do_shortcode_tag',
	function ($output, $tag, $attributes) {
		if ('contact-form-7' !== $tag) return $output;

		return do_blocks($output);
	},
	10,
	3
);
