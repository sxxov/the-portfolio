<?php

namespace app\theatre\studio;

use function bare\module\client\enqueue_script_type_module;
use function bare\utilities\url\get_uri;

if (is_user_logged_in() && current_user_can('edit_posts')) {
	$handle = 'theatre/studio';
	$path = __DIR__ . '/studio.js';
	wp_enqueue_script(
		$handle,
		get_uri($path),
		ver: filemtime($path),
	);
	enqueue_script_type_module($handle);
}
