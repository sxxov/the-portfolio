<?php

namespace app\terms\inherited_terms_query;

const VARIATION_ATTRIBUTE = 'inheritedTermsQueryVariant';

add_filter('register_block_type_args', function ($args, $name) {
	switch ($name) {
		case 'core/terms-query':
			$args['uses_context'] ??= [];
			$args['uses_context'][] = 'postId';
			$args['uses_context'][] = 'postType';

			$args['provides_context'] ??= [];
			$args['provides_context'][VARIATION_ATTRIBUTE] = VARIATION_ATTRIBUTE;

			$args['attributes'] ??= [];
			$args['attributes'][VARIATION_ATTRIBUTE] = [
				'type' => 'boolean',
				'default' => false,
			];

			break;
		case 'core/term-template':
			$args['uses_context'] ??= [];
			$args['uses_context'][] = 'postId';
			$args['uses_context'][] = 'postType';
			$args['uses_context'][] = VARIATION_ATTRIBUTE;

			break;
		default:
	}

	return $args;
}, 10, 2);

track_block_stack('core/query');

add_filter('render_block_context', function (
	array $context,
	array $block,
	?\WP_Block $instance,
) {
	if ($block['blockName'] !== 'core/term-template')
		return $context;

	/** @var bool */
	$is_variation = $context[VARIATION_ATTRIBUTE] ?? false;
	if (!$is_variation) return $context;

	/** @var ?array<string,mixed> */
	$q = $context['termQuery'] ?? null;
	if (!$q) return $context;

	/** @var ?string */
	$taxonomy = $q['taxonomy'] ?? null;
	/** @var bool */
	$show_nested = $q['showNested'] ?? false;
	/** @var bool */
	$hide_empty = $q['hideEmpty'] ?? false;
	/** @var bool */
	$inherit = $q['inherit'] ?? false;

	$stack = track_block_stack();

	// only consider the `postId` context if we're inside a query loop block.
	//
	// otherwise, it's the global query's post ID, which would be the main
	// loop's first post if we were in an archive. instead, we want to use
	// what the main loop's queried object is in that case, which could be
	// a term or post type.
	$context_post_id = $context['postId'] ?? null;
	$queried_object = (
		in_array('core/query', $stack) && $context_post_id
		? get_post($context_post_id)
		: null
	) ?: get_queried_object();

	if ($inherit && $queried_object instanceof \WP_Term) {
		$q['inherit'] = false;
		$q['taxonomy'] = $queried_object->taxonomy;
		$taxonomy = $q['taxonomy'];
	}

	/** @var int[] */
	$include = $q['include'] ?? [];
	switch (true) {
		case $queried_object instanceof \WP_Term:
			$term = $queried_object;

			if ($inherit) {
				/** @var int[]|\WP_Error */
				$term_ids = get_terms([
					'taxonomy'   => $term->taxonomy,
					'hide_empty' => $hide_empty,
					'orderby'    => 'name',
					'order'      => 'ASC',
					'fields'     => 'ids',
				]);
				if (is_wp_error($term_ids)) break;
			} else {
				// get all post ids with this term
				/** @var int[] */
				$post_ids = get_posts([
					'post_status'    => 'publish',
					'fields'         => 'ids',
					'posts_per_page' => -1,
					'no_found_rows'  => true,
					'tax_query'      => [[
						'taxonomy'         => $term->taxonomy,
						'field'            => 'term_id',
						'terms'            => $term->term_id,
						'include_children' => $show_nested,
					]],
				]);

				// get terms that appear on those posts
				/** @var int[]|\WP_Error */
				$term_ids = get_terms([
					'hide_empty' => $hide_empty,
					'object_ids' => $post_ids ?: [0],
					'orderby'    => 'name',
					'order'      => 'ASC',
					'fields'     => 'ids',
				]);
				if (is_wp_error($term_ids)) break;
			}

			array_push($include, ...$term_ids);
			break;
		case $queried_object instanceof \WP_Post_Type:
			$post_type = $queried_object;

			// get all post IDs in this post type
			$post_ids = get_posts([
				'post_type'      => $post_type->name,
				'post_status'    => 'publish',
				'fields'         => 'ids',
				'posts_per_page' => -1,
				'no_found_rows'  => true,
			]);

			// get terms that appear on those posts
			/** @var int[]|\WP_Error */
			$term_ids = get_terms([
				...$taxonomy ? ['taxonomy' => $taxonomy] : [],
				'hide_empty' => $hide_empty,
				'object_ids' => $post_ids ?: [0],
				'orderby'    => 'name',
				'order'      => 'ASC',
				'fields'     => 'ids',
			]);
			if (is_wp_error($term_ids)) break;

			array_push($include, ...$term_ids);
			break;
		case $queried_object instanceof \WP_Post:
			$post = $queried_object;

			/** @var int[]|\WP_Error */
			$term_ids = get_terms([
				...$taxonomy ? ['taxonomy' => $taxonomy] : [],
				'hide_empty' => $hide_empty,
				'object_ids' => [$post->ID],
				'orderby'    => 'name',
				'order'      => 'ASC',
				'fields'     => 'ids',
			]) ?: [];
			if (is_wp_error($term_ids)) break;

			array_push($include, ...$term_ids);
			break;
		default:
			return $context;
	}

	// empty arrays are ignored when passed into `include`,
	// so we fallback to [0]
	$q['include'] = array_unique($include) ?: [0];
	$context['termQuery'] = $q;

	return $context;
}, 10, 3);

/** @param array<int,string> $tracked_block_names */
function track_block_stack(string ...$tracked_block_names) {
	/** @var ?array<int,string> */
	static $stack = null;
	/** @var array<string,true> */
	static $tracked_block_name_set = [];

	// remove already-tracked block names
	foreach ($tracked_block_names as $i => $tracked_block_name)
		if (isset($tracked_block_name_set[$tracked_block_name]))
			unset($tracked_block_names[$i]);

	// nothing to track after dedupe
	if (!$tracked_block_names) return $stack;

	// add new tracked block names
	foreach ($tracked_block_names as $tracked_block_name)
		$tracked_block_name_set[$tracked_block_name] = true;

	// initialize stack tracking
	if (!$stack) {
		$stack = [];
		add_filter('render_block_data', function ($block) use (
			&$stack,
			$tracked_block_name_set,
		) {
			$block_name = $block['blockName'] ?? null;
			if (!$block_name) return $block;

			if (!isset($tracked_block_name_set[$block_name]))
				return $block;

			array_push($stack, $block_name);
			// echo str_repeat('  ', count($stack) - 1) . end($stack) . PHP_EOL;

			return $block;
		}, 0);
		add_filter('render_block', function ($content, $block) use (
			&$stack,
			$tracked_block_name_set,
		) {
			$block_name = $block['blockName'] ?? null;
			if (!$block_name) return $content;

			if (!isset($tracked_block_name_set[$block_name]))
				return $content;

			if ($block_name !== end($stack)) return $content;

			array_pop($stack);
			// echo str_repeat('  ', count($stack)) . '/' . ($block_name) . PHP_EOL;

			return $content;
		}, PHP_INT_MAX, 2);
	}

	return $stack;
}
