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
