<?php

namespace app\posts;

use function bare\module\runtime\get_post_dependencies;
use function bare\utilities\editor\sniff_post_id;

const POSTS_DIRECTORY = __DIR__;
const POSTS_METADATA_FILE = POSTS_DIRECTORY . '/posts.json';

// loading editor
add_action('admin_init', function () {
	perform_migrations();

	$post_id = sniff_post_id();
	if (!$post_id) return;

	$post = get_post($post_id);
	if (
		!$post ||
		is_excluded_post(
			$post->post_type,
			$post->post_name,
			$post_id,
		)
	) return;

	$disk_post = find_disk_post(
		$post->post_type,
		$post_id,
	);
	if (!$disk_post) {
		// read from database, write to disk (new canonical)
		$path = get_disk_post_path(
			$post->post_type,
			$post->post_name,
			$post_id,
		);
		$content = $post->post_content;
		write_disk_post($path, $content);

		return;
	}

	// read from disk (canonical), write to database if changed
	['path' => $path, 'post_name' => $post_name] = $disk_post;
	$content = read_disk_post($path);
	if ($content === null) return;

	if ($post_name !== $post->post_name)
		rename_database_post($post_id, $post_name);
	if ($content !== $post->post_content)
		write_database_post($post_id, $content);
});

// saving edited post to database
add_action('save_post', function (
	int $post_id,
	\WP_Post $post,
	bool $update,
) {
	if (
		is_excluded_post(
			$post->post_type,
			$post->post_name,
			$post_id,
		)
	)
		return;

	$disk_post = find_disk_post($post->post_type, $post_id);
	['path' => $path, 'post_name' => $post_name] = $disk_post ?? [
		'path' => get_disk_post_path(
			$post->post_type,
			$post->post_name,
			$post_id,
		),
		'post_name' => $post->post_name,
	];

	if ($post_name !== $post->post_name) {
		rename_disk_post(
			$post->post_type,
			$post_name,
			$post->post_name,
			$post_id,
		);
		$path = get_disk_post_path(
			$post->post_type,
			$post->post_name,
			$post_id,
		);
	}

	write_disk_post($path, $post->post_content);
}, 10, 3);

// permanently deleting post after trashing
add_action('delete_post', function (
	int $post_id,
	\WP_Post $post,
) {
	$disk_post = find_disk_post($post->post_type, $post_id);
	if (!$disk_post) return;
	['path' => $path] = $disk_post;

	unlink($path);
}, 10, 2);

// loading post from database
add_filter('the_content', function (string $content) {
	if (!current_user_can('edit_posts'))
		return $content;

	$post_id = sniff_post_id();
	if (!$post_id) return $content;

	$post = get_post($post_id);
	if (!$post) return $content;

	// write the post & all its dependencies to disk
	$is_excluded = is_excluded_post(
		$post->post_type,
		$post->post_name,
		$post_id
	);
	$dependency_ids = [
		...$is_excluded ? [] : [$post_id],
		...get_post_dependencies($post_id) ?: [],
	];
	foreach ($dependency_ids as $dependency_id) {
		$dependency_ids = get_post_dependencies($dependency_id) ?: [];
		$ids_list[] = $dependency_ids;

		$dependency_post = get_post($dependency_id);
		if (!$dependency_post) continue;

		$is_dependency_excluded = is_excluded_post(
			$dependency_post->post_type,
			$dependency_post->post_name,
			$dependency_id,
		);
		if ($is_dependency_excluded) continue;

		$disk_post = find_disk_post(
			$post->post_type,
			$dependency_id,
		);
		if (!$disk_post) continue;
		['path' => $path] = $disk_post;

		$disk_content = read_disk_post($path);
		if ($disk_content === null) continue;

		write_database_post($dependency_id, $disk_content);
	}

	return $content;
}, 0);

function perform_migrations() {
	$metadata = get_posts_metadata();

	$live_site_url = site_url();
	$disk_site_url = $metadata['site']['url'];

	/** @var (callable():void)[] */
	$migration_before_steps = [];
	/** @var (callable(string $path):void)[] */
	$migration_child_steps = [];
	/** @var (callable():void)[] */
	$migration_after_steps = [];

	$should_migrate_post_urls = $live_site_url !== $disk_site_url;
	if ($should_migrate_post_urls) {
		$migration_before_steps[] = function () use (
			&$metadata,
			$live_site_url,
		) {
			$metadata['site']['url'] = $live_site_url;
		};
		$migration_child_steps[] = function ($path) use (
			$live_site_url,
			$disk_site_url,
		) {
			migrate_post_url(
				$path,
				$live_site_url,
				$disk_site_url,
			);
		};
	}

	if (count($migration_before_steps) > 0)
		foreach ($migration_before_steps as $step)
			$step();

	if (count($migration_child_steps) > 0)
		foreach (
			new \RecursiveIteratorIterator(
				new \RecursiveDirectoryIterator(POSTS_DIRECTORY),
			) as $file
		) {
			/** @var \SplFileInfo */
			$file = $file;

			if (!$file->isFile()) continue;

			$path = $file->getPathname();
			if (!str_ends_with($path, '.html')) continue;

			foreach ($migration_child_steps as $step)
				$step($path);
		}

	if (count($migration_after_steps) > 0)
		foreach ($migration_after_steps as $step)
			$step();
}

function migrate_post_url(
	string $path,
	string $live_site_url,
	string $disk_site_url,
) {
	$disk_post = parse_disk_post($path);
	if (!$disk_post) return;
	['post_id' => $post_id] = $disk_post;

	$content = read_disk_post($path);
	if ($content === null) return;

	$updated_content = str_replace(
		$disk_site_url,
		$live_site_url,
		$content
	);
	if ($updated_content == $content) return;

	write_disk_post($path, $updated_content);
	write_database_post($post_id, $updated_content);
}

function read_database_post(int $post_id) {
	$post = get_post($post_id);
	if (!$post) return;

	return $post->post_content;
}

function rename_database_post(int $post_id, string $post_name) {
	$post = get_post($post_id);
	if (!$post) return;

	$post->post_name = $post_name;
	wp_update_post($post);
}

function write_database_post(int $post_id, string $content) {
	$post = get_post($post_id);
	if (!$post) return;

	if (!$content) throw new \Exception('Assertion: Cannot write empty post content.');

	$post->post_content = $content;
	wp_update_post($post);
}

function read_disk_post(string $path) {
	if (!is_file($path)) return;

	$content = file_get_contents($path);
	if ($content === false) return;

	return $content;
}

function rename_disk_post(
	string $post_type,
	string $old_post_name,
	string $new_post_name,
	int $post_id,
) {
	$old_path = get_disk_post_path(
		$post_type,
		$old_post_name,
		$post_id
	);
	if (!is_file($old_path)) return;

	$new_path = get_disk_post_path(
		$post_type,
		$new_post_name,
		$post_id
	);
	rename($old_path, $new_path);
}

function write_disk_post(string $path, string $content) {
	// recursively create parent directories
	$directory = dirname($path);
	if (!is_dir($directory))
		mkdir(
			$directory,
			// u=rwx,g=rwx,o=rx
			0775,
			true
		);

	file_put_contents($path, $content);
}

function find_disk_post(string $post_type, int $post_id) {
	$base = POSTS_DIRECTORY . "/$post_type";
	if (!is_dir($base)) return null;

	foreach (scandir($base) as $filename) {
		if ($filename === '.' || $filename === '..') continue;

		$path = "$base/$filename";

		$disk_post = parse_disk_post($path);
		if (!$disk_post) continue;
		['post_id' => $current_post_id] = $disk_post;

		if ($current_post_id === $post_id)
			return $disk_post;
	}
}

function get_disk_post_path(
	string $post_type,
	string $post_name,
	int $post_id,
) {
	return POSTS_DIRECTORY . "/$post_type/$post_name.$post_id.html";
}

function parse_disk_post(string $path) {
	/** @var array<string,array{path:string,post_id:int,post_type:string,post_name:string}> */
	static $disk_post_cache = [];

	$disk_post = $disk_post_cache[$path] ?? null;
	if (!$disk_post) {
		$directory = dirname($path);
		$filename = basename($path);

		$post_type = basename($directory);

		preg_match(
			'/^(?<post_name>.*)\.(?<post_id>\d+)\.html$/',
			$filename,
			$matches
		);
		['post_name' => $post_name, 'post_id' => $post_id] = $matches;

		if ($post_name && is_numeric($post_id)) {
			$disk_post = [
				'path' => $path,
				'post_id' => (int) $post_id,
				'post_type' => $post_type,
				'post_name' => $post_name,
			];
			$disk_post_cache[$path] = $disk_post;
		}
	}

	return $disk_post;
}

/** @var array{version:int,site:array{url:string}} */
$posts_metadata = null;
function get_posts_metadata() {
	global $posts_metadata;
	if ($posts_metadata) return $posts_metadata;

	$exists = is_file(POSTS_METADATA_FILE);
	$content = null;
	if ($exists)
		$content = file_get_contents(POSTS_METADATA_FILE) ?: null;

	if ($content !== null) {
		/** @var ?array{version:int,site:array{url:string}} */
		$json = json_decode($content, true);

		$posts_metadata = is_array($json) ? $json : [];
	}
	$posts_metadata['version'] ??= 1;
	$posts_metadata['site'] ??= [];
	$posts_metadata['site']['url'] ??= site_url();

	set_posts_metadata($posts_metadata);

	return $posts_metadata;
}
function set_posts_metadata(array $metadata) {
	global $posts_metadata;

	$posts_metadata = $metadata;
	file_put_contents(
		POSTS_METADATA_FILE,
		json_encode($metadata, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
	);
}

function is_excluded_post(
	string $post_type,
	string $post_name,
	int $post_id,
) {
	$is_component_block = $post_type === 'wp_block' ||
		$post_type === 'wp_template_part' ||
		$post_type === 'wp_template';
	if ($is_component_block) return false;

	$post_type_object = get_post_type_object($post_type);
	$private = $post_type_object
		? !$post_type_object->public
		: false;
	if ($private) return true;

	$excluded_from_search = $post_type_object
		? $post_type_object->exclude_from_search
		: false;
	if ($excluded_from_search) return true;

	$has_empty_post_name = $post_name === '';
	if ($has_empty_post_name) return true;

	$is_trash_post_type = (
		wp_is_post_revision($post_id) ||
		wp_is_post_autosave($post_id) ||
		$post_type === 'attachment' ||
		str_starts_with($post_type, 'acf-')
	);
	if ($is_trash_post_type) return true;

	return false;
}
