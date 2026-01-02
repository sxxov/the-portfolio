<?php

namespace app\monkey\terms_query;

use function bare\module\client\enqueue_script_type_module;
use function bare\utilities\url\get_uri;

const VARIATION_ATTRIBUTE = 'inheritedTermsQueryVariant';

add_action('enqueue_block_editor_assets', function () {
	$handle = __NAMESPACE__ . '/variation';
	$path = __DIR__ . '/index.js';

	wp_enqueue_script(
		$handle,
		get_uri($path),
		ver: filemtime($path),
	);
	enqueue_script_type_module($handle);
});

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

	$context_post_id = $context['postId'] ?? null;
	$queried_object = (
		!$inherit && $context_post_id
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
			if ($inherit)
				usort(
					$include,
					function ($a, $b) use ($term) {
						if ($a === $b) return 0;
						if ($a === $term->term_id) return -1;
						if ($b === $term->term_id) return 1;
						return 0;
					}
				);
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
