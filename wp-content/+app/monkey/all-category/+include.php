<?php

namespace app\monkey\all_category;

const ALL_CATEGORY_TERM_ID = PHP_INT_MAX - 1;
const ALL_CATEGORY_TERM_NAME = 'All';
const ALL_CATEGORY_TERM_SLUG = 'all';
const ALL_CATEGORY_TERM_DESCRIPTION = 'Virtual category for all posts';

add_filter('get_terms', function ($terms, $taxonomies, $args) {
	// only for categories
	if (!in_array('category', (array) $taxonomies, true)) return $terms;

	// avoid adding it in weird internal cases
	if (!empty($args['fields']) && $args['fields'] !== 'all') return $terms;

	// throw (is_archive() ? 'a' : 'b');

	// build a "fake" term object
	$all = new \WP_Term((object) [
		'term_id' => ALL_CATEGORY_TERM_ID,
		'taxonomy' => 'category',
		'name' => ALL_CATEGORY_TERM_NAME,
		'slug' => ALL_CATEGORY_TERM_SLUG,
		'term_group' => 0,
		'term_taxonomy_id' => 0,
		'description' => ALL_CATEGORY_TERM_DESCRIPTION,
		'parent' => 0,
		'count' => 0,
		'filter' => 'raw',
	]);
	wp_cache_set(
		$all->term_id,
		$all,
		"terms",
	);

	return [
		$all,
		...$terms,
	];
}, 10, 3);

$is_currently_all_archive = false;

add_action('pre_get_posts', function (\WP_Query $q) use (&$is_currently_all_archive) {
	if (is_admin() || !$q->is_main_query()) return;


	// if "all" was chosen as the category slug, remove the category constraint
	if ($q->get('category_name') === 'all') {
		$is_currently_all_archive = true;

		$q->set('category_name', '');
		$q->set('cat', '');
		$q->set('category__in', []);
		$q->set('category__not_in', []);
		$q->set('tax_query', []);
	}
});

add_filter('get_the_archive_title', function ($title) use (&$is_currently_all_archive) {
	if (!$is_currently_all_archive) return $title;

	return ALL_CATEGORY_TERM_NAME;
});
