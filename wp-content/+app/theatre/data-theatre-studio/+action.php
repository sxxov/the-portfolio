<?php

namespace app\theatre\studio;

use function bare\utilities\url\get_uri;

if (is_user_logged_in() && current_user_can('edit_posts')) {
	$path = __DIR__ . '/studio.js';
	wp_enqueue_script_module(
		'theatre/studio',
		get_uri($path),
		version: filemtime($path),
	);
}
