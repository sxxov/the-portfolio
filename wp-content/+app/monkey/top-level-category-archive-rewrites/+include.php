<?php

namespace app\monkey\top_level_category_archive_rewrites;

add_action('init', function () {
	// feeds: /{cat}/feed/  OR /{cat}/rss2/ etc
	add_rewrite_rule(
		'^(.+?)/(?:feed/(feed|rdf|rss|rss2|atom)|'
			. '(feed|rdf|rss|rss2|atom))/?$',
		'index.php?category_name=$matches[1]&feed=$matches[2]$matches[3]',
		'top'
	);

	// pagination: /{cat}/page/2/
	add_rewrite_rule(
		'^(.+?)/page/([0-9]+)/?$',
		'index.php?category_name=$matches[1]&paged=$matches[2]',
		'top'
	);

	// embed: /{cat}/embed/
	add_rewrite_rule(
		'^(.+?)/embed/?$',
		'index.php?category_name=$matches[1]&embed=true',
		'top'
	);

	// archive: /{cat}/
	add_rewrite_rule(
		'^(.+?)/?$',
		'index.php?category_name=$matches[1]',
		'bottom'
	);
}, 10);

add_filter('term_link', function ($link, $term, $taxonomy) {
	if ($taxonomy !== 'category') return $link;

	if (!$term instanceof \WP_Term) {
		$term = get_term($term, 'category');
		if (!$term || is_wp_error($term)) return $link;
	}

	$path = $term->slug;
	if ($term->parent) {
		$parents = get_category_parents($term->parent, false, '/', true);
		if (is_wp_error($parents)) return $link;
		$path = trim($parents, '/') . '/' . $term->slug;
	}

	return home_url(user_trailingslashit($path, 'category'));
}, 10, 3);
