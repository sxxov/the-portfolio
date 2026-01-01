<?php

namespace app\monkey\post_terms_query;

add_filter('render_block_context', function (
	array $context,
	array $block,
	?\WP_Block $instance,
) {
	if ('core/term-template' !== $block['blockName']) return $context;

	$post_id = null
		?: ($context['postId'] ?? null)
		?: get_queried_object_id()
		?: get_the_ID();
	if (!$post_id) return $context;

	$q = &$context['termQuery'] ?? null;
	if (!$q) return $context;

	$taxonomy = $q['taxonomy'] ?? null;
	if (!$taxonomy) return $context;

	$terms = get_the_terms($post_id, $taxonomy);
	if (!$terms || is_wp_error($terms))
		return $context;

	$q['include'] = wp_list_pluck($terms, 'term_id');
	$context['termQuery'] = $q;

	return $context;
}, 10, 3);
