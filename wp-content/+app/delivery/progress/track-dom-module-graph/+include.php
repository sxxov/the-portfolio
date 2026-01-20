<?php

namespace app\delivery\progress\track_dom_module_graph;

use function bare\module\client\enqueue_script_type_module;
use function bare\utilities\url\get_uri;

foreach (['before' => 5, 'after' => 20] as $position => $priority)
	add_action('wp_enqueue_scripts', function () use ($position) {
		$handle = __NAMESPACE__ . "/$position";
		$path = __DIR__ . "/$position.js";
		wp_enqueue_script(
			$handle,
			get_uri($path),
			ver: filemtime($path),
		);
		enqueue_script_type_module($handle);
	}, $priority, 0);
