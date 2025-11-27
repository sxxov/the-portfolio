<?php

namespace app\package;

use const app\NS;
use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

const DEPENDENCY_DECLARATION_PROXY_SCRIPT_ID = NS . '/package/imports/proxy';
const DEPENDENCY_DECLARATION_LOADER_SCRIPT_ID = NS . '/package/imports/loader';

add_action('enqueue_block_assets', function () {
	enqueue_imports();

	// shove block import map into block editor iframe
	// https://github.com/WordPress/gutenberg/issues/64482
	if (is_admin() && get_current_screen()?->is_block_editor()) {
		$imports = get_imports();
		$import_json = json_encode($imports, JSON_PRETTY_PRINT);

		wp_register_script(DEPENDENCY_DECLARATION_LOADER_SCRIPT_ID, false);
		wp_enqueue_script(DEPENDENCY_DECLARATION_LOADER_SCRIPT_ID);
		wp_add_inline_script(
			DEPENDENCY_DECLARATION_LOADER_SCRIPT_ID,
			<<<JS
			if (window.self !== window.top) {
				const script = document.createElement('script');
				script.type = 'importmap';
				script.textContent = `{ "imports": $import_json }`;
				document.head.append(script);
			}
			JS
		);
	}
}, 1, 0);

function enqueue_imports() {
	$imports = get_imports();

	foreach ($imports as $specifier => $url)
		wp_register_script_module(
			$specifier,
			$url,
			deps: [],
		);
	wp_enqueue_script_module(
		DEPENDENCY_DECLARATION_PROXY_SCRIPT_ID,
		'data:text/javascript,export {}',
		deps: array_keys($imports),
		version: null,
	);
}

function get_imports() {
	$imports = [];

	$dir = new RecursiveDirectoryIterator(__DIR__);
	$dir->setFlags(
		FilesystemIterator::SKIP_DOTS
			| FilesystemIterator::CURRENT_AS_FILEINFO
			| FilesystemIterator::FOLLOW_SYMLINKS
	);

	$iter = new RecursiveIteratorIterator($dir);

	foreach ($iter as $file) {
		if (!$file->isFile())
			continue;

		$path = $file->getPathname();
		if (!str_ends_with($path, '.js'))
			continue;

		$relFromDir = substr($path, strlen(__DIR__ . '/'));
		$rel = str_replace(DIRECTORY_SEPARATOR, '/', $relFromDir);

		// derive specifier: drop '/index.js' but keep other filenames (with extension)
		if ($rel === 'index.js')
			// top-level index.js has no valid bare specifier, skip
			continue;

		$specifier = str_ends_with($rel, '/index.js')
			? substr($rel, 0, -strlen('/index.js'))
			: $rel;

		// compute public url under wp-content
		$relFromContent = ltrim(str_replace(WP_CONTENT_DIR, '', $path), DIRECTORY_SEPARATOR);
		$url = content_url($relFromContent);

		$imports[$specifier] = $url;
	}

	if ($imports)
		ksort($imports, SORT_NATURAL | SORT_FLAG_CASE);

	return $imports;
}
