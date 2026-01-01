<?php

namespace app\tools\migration\redirect;

add_action('template_redirect', function () {
	if (is_admin() || wp_doing_ajax() || wp_doing_cron())
		return;
	if (!is_404()) return;

	$normalise_path = static function (?string $path): string {
		$path = trim((string) $path);
		if ($path === '')
			return '';

		$path = '/' . ltrim($path, '/');
		return $path === '/' ? $path : untrailingslashit($path);
	};

	$current_path = $normalise_path(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: '');
	if ($current_path === '' || $current_path === '/')
		return;

	global $wpdb;
	$meta_key = 'migration_source_url';
	$query = $wpdb->prepare(
		"
			SELECT post_id, meta_value
			FROM {$wpdb->postmeta}
			WHERE meta_key = %s
				AND meta_value LIKE %s
			",
		[
			$meta_key,
			'%' . $wpdb->esc_like($current_path) . '%'
		],
	);
	$rows = $wpdb->get_results(
		$query,
		ARRAY_A,
	);
	if (!$rows) return;

	foreach ($rows as $row) {
		['post_id' => $post_id] = $row;
		if (!$post_id) continue;

		$migration = get_field('migration', $post_id);
		if (!$migration) continue;

		$url = $migration['source']['url']['url'] ?? null;
		$source_path = $normalise_path(parse_url($url, PHP_URL_PATH) ?: '');
		if ($source_path === '' || $source_path !== $current_path)
			continue;

		$target = get_permalink((int) $post_id);
		if (!$target)
			continue;

		$target_path = $normalise_path(parse_url($target, PHP_URL_PATH) ?: '');
		if ($target_path === $current_path)
			continue;

		wp_redirect($target, 308);
		exit;
	}
});
