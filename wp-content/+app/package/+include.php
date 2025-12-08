<?php

namespace app\package;

use FilesystemIterator;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

use function bare\module\runtime\use_module_alias;

const DEPENDENCY_DECLARATION_PROXY_SCRIPT_ID = 'package/imports/proxy';
const DEPENDENCY_DECLARATION_LOADER_SCRIPT_ID = 'package/imports/loader';

$imports = get_imports();
foreach ($imports as $specifier => $url)
	use_module_alias($specifier, $url);

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
		$url = add_query_arg(['ver' => filemtime($path)], $url);

		$imports[$specifier] = $url;
	}

	if ($imports)
		ksort($imports, SORT_NATURAL | SORT_FLAG_CASE);

	return $imports;
}
