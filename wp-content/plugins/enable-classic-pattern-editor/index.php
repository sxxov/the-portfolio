<?php

/**
 * Plugin Name:       Enable Classic Pattern Editor
 * Description:       Adds a menu item to redirect to the classic post-list of patterns (<code>edit.php</code>) instead of the fancy new one (<code>site-editor.php</code>).
 * Version:           20250319-7db4891
 * Author:            jiaSheng
 */

add_filter('register_post_type_args', function (
	array $args,
	string $post_type
) {
	switch ($post_type) {
		case 'wp_block':
			$args['show_ui'] = true;
			$args['show_in_menu'] = true;
			break;

		default:
	}

	return $args;
}, 11, 2);

add_action('admin_menu', function () {
	global $menu, $submenu;

	$index = 25;
	while (isset($menu[$index])) $index++;

	$menu[$index] = [
		'Patterns',
		'edit_posts',
		'edit.php?post_type=wp_block',
		'',
		'menu-top menu-icon-wp_block',
		'menu-posts-wp_block',
		'dashicons-block-default'
	];
	$submenu['edit.php?post_type=wp_block'][5] = [
		'All Patterns',
		'edit_posts',
		'edit.php?post_type=wp_block',
	];
	$submenu['edit.php?post_type=wp_block'][10] = [
		'Add New Pattern',
		'edit_posts',
		'post-new.php?post_type=wp_block'
	];
	$submenu['edit.php?post_type=wp_block'][15] = [
		'Pattern Categories',
		'manage_categories',
		'edit-tags.php?taxonomy=wp_pattern_category&post_type=wp_block'
	];
}, 10, 0);

add_filter('manage_wp_block_posts_columns', function (array $posts_columns) {
	$cb = $posts_columns['cb'];
	unset($posts_columns['cb']);
	$title = $posts_columns['title'];
	unset($posts_columns['title']);

	return array_merge([
		'cb' => $cb,
		'title' => $title,
		'id' => 'ID'
	], $posts_columns);
}, 10, 1);

add_action('manage_posts_custom_column', function (string $column, int $post_id) {
	switch ($column) {
		case 'id':
			echo "<code>$post_id</code>";
			break;

		default:
	}
}, 10, 2);

add_action('admin_enqueue_scripts', function ($hook) {
	switch ($hook) {
		case 'edit.php':
			$post_type = $_GET['post_type'] ?? null;
			if ($post_type !== 'wp_block') break;

			$id_handle = 'pattern-column-id';
			wp_register_style($id_handle, false);
			wp_enqueue_style($id_handle);
			wp_add_inline_style(
				$id_handle,
				<<<CSS
					.column-id {
						width: 4em;
					}
				CSS,
			);

			$pattern_category_handle = 'pattern-column-pattern_category';
			wp_register_style($pattern_category_handle, false);
			wp_enqueue_style($pattern_category_handle);
			wp_add_inline_style(
				$pattern_category_handle,
				<<<CSS
					.column-taxonomy-wp_pattern_category {
						width: 10em;
					}
				CSS,
			);
			break;

		default:
	}
});
