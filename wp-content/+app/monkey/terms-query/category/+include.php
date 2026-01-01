<?php

namespace app\monkey\post_terms_query;

add_filter('render_block_context', function (
    array $context,
    array $block,
    ?\WP_Block $instance,
) {
    if ('core/term-template' !== $block['blockName']) return $context;

    $post_id = $context['postId'] ?? null;
    if ($post_id) return $context;

    // if (!is_category()) return $context;

    $term = get_queried_object();
    if (!($term instanceof \WP_Term)) return $context;

    $q = &$context['termQuery'] ?? null;
    if (!$q) return $context;

    // Get all post IDs in this category (no pagination)
    $post_ids = get_posts([
        'post_type'      => 'post',
        'post_status'    => 'publish',
        'fields'         => 'ids',
        'posts_per_page' => -1,
        'no_found_rows'  => true,
        'tax_query'      => [[
            'taxonomy'         => $term->taxonomy,
            'field'            => 'term_id',
            'terms'            => $term->term_id,
            'include_children' => true, // set false if you only want this exact category
        ]],
    ]);

    // Fetch tags that appear on those posts
    /** @var int[] */
    $tags = get_terms([
        'hide_empty' => true,
        'object_ids' => $post_ids,
        'orderby'    => 'name',
        'order'      => 'ASC',
        'fields'     => 'ids',
    ]);

    $q['include'] = $tags;
    $context['termQuery'] = $q;

    return $context;
}, 10, 3);
