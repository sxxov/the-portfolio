import { registerBlockVariation } from '/+std/@wordpress/blocks.js';
import { InspectorControls } from '/+std/@wordpress/block-editor.js';
import { PanelBody, ToggleControl } from '/+std/@wordpress/components.js';
import { addFilter } from '/+std/@wordpress/hooks.js';
import { Fragment } from '/+std/@wordpress/element.js';
import { x } from '/+std/react/x.js';
import { select, useSelect } from '/+std/@wordpress/data.js';
import { some } from '/+std/functional/some.js';
import { cast } from '/+std/type/utilities/cast.js';
/** @import { BlockEditProps, BlockInstance } from "@wordpress/blocks" */
/** @import { Post, Term } from "@wordpress/core-data" */

const variationAttributeName = 'inheritedTermsQueryVariant';

// register variation
registerBlockVariation('core/terms-query', {
	name: 'app/monkey/terms-query/inherited',
	title: 'Inherited Terms Query',
	description: 'Use the current loop to filter terms.',
	attributes: { [variationAttributeName]: true },
	isActive: ({ [variationAttributeName]: variant }) => variant,
	scope: ['block', 'inserter'],
});

// variation controls
addFilter(
	'editor.BlockEdit',
	'app/monkey/inherited-terms-query/controls',
	(BlockEdit) =>
		(
			/**
			 * @type {BlockEditProps<{
			 * 	termQuery?: Record<string, any>;
			 * 	[variationAttributeName]?: boolean | undefined;
			 * }> &
			 * 	BlockInstance<{}>}
			 */ props,
		) => {
			if (props.name !== 'core/terms-query') return x(BlockEdit, props);

			const { attributes, setAttributes } = props;
			const variant = attributes[variationAttributeName] ?? '';

			return x(
				Fragment,
				{},
				x(BlockEdit, props),
				x(
					InspectorControls,
					{},
					x(
						PanelBody,
						{ title: 'Inherit', initialOpen: true },
						x(ToggleControl, {
							label: 'Filter by current query',
							checked: Boolean(variant),
							onChange: (next) => {
								setAttributes({
									[variationAttributeName]:
										next ? true : undefined,
								});
							},
						}),
					),
				),
			);
		},
);

// modify query based on context
addFilter(
	'editor.BlockEdit',
	'app/monkey/inherited-terms-query/term-template',
	(BlockEdit) =>
		(
			/**
			 * @type {BlockEditProps<{
			 * 	[variationAttributeName]?: boolean | undefined;
			 * }> &
			 * 	BlockInstance<{}>}
			 */ props,
		) => {
			const { context } = props;
			const { postType, postId, termQuery } = context ?? {};
			const enabled = Boolean(
				props.name === 'core/term-template' &&
					context[variationAttributeName] === true &&
					postType &&
					postId &&
					termQuery,
			);
			/** @type {typeof cast<string>} */ (cast)(postType);
			/** @type {typeof cast<number>} */ (cast)(postId);
			/** @type {typeof cast<Record<string, any>>} */ (cast)(termQuery);

			const { termsByTaxonomy, allTerms } = usePostTerms(
				/** @type {string} */ (postType ?? ''),
				/** @type {number} */ (postId ?? 0),
				{ enabled },
			);

			let modifiedTermQuery = termQuery;
			if (enabled && termsByTaxonomy && allTerms) {
				const taxonomy =
					termQuery['inherit'] ? undefined : termQuery['taxonomy'];
				const terms =
					taxonomy ? (termsByTaxonomy.get(taxonomy) ?? []) : allTerms;
				const termIds = terms.map((term) => term.id);
				modifiedTermQuery = { ...termQuery, include: termIds };
			}

			return x(BlockEdit, {
				key: 'edit',
				...props,
				...(modifiedTermQuery === termQuery ?
					{ context }
				:	{
						context: {
							...context,
							termQuery: modifiedTermQuery,
						},
					}),
			});
		},
);

export function usePostTerms(
	/** @type {String} */ postType,
	/** @type {number} */ postId,
	{ enabled = false } = {},
) {
	return useSelect(() => {
		if (!enabled)
			return {
				post: undefined,
				termsByTaxonomy: undefined,
				allTerms: undefined,
				isLoading: false,
			};

		const core = select('core');

		// 1. fetch the post entity
		const post = /** @type {Post | undefined} */ (
			core.getEntityRecord('postType', postType, postId)
		);
		const isResolvingPost = core.isResolving('getEntityRecord', [
			'postType',
			postType,
			postId,
		]);

		if (!post)
			return {
				post: undefined,
				termsByTaxonomy: undefined,
				allTerms: undefined,
				isLoading: isResolvingPost,
			};

		// 2. find taxonomies that apply to this post type
		const taxonomies =
			/** @type {Term[] | null} */ (
				core.getEntityRecords('root', 'taxonomy', { type: postType })
			) ?? [];

		// 3. for each taxonomy, read term IDs from the post object, then fetch those term entities
		/** @type {Map<string, Term[]>} */
		const termsByTaxonomy = new Map();
		for (const tax of taxonomies) {
			const { slug } = tax;

			// `rest_base` is an undocumented property that WP REST uses for the post object keys
			// `Post` has this special `rest_base` as the key to term IDs
			// for categories: rest_base = `categories`, slug = `category`
			// for tags: rest_base = `tags`, slug = `post_tag`
			/** @type {string} */
			const postTaxonomyKey = /** @type {any} */ (tax).rest_base;
			const termIds =
				/** @type {Record<string, number[]>} */ (
					/** @type {unknown} */ (post)
				)[postTaxonomyKey] ?? [];

			const terms = termIds
				.map(
					(id) =>
						/** @type {Term | undefined} */ (
							core.getEntityRecord('taxonomy', slug, id)
						),
				)
				.filter(some);

			termsByTaxonomy.set(slug, terms);
		}

		const allTerms = [...termsByTaxonomy.values()].flat();

		// loading if any term is still resolving
		const isLoadingTerms = [...termsByTaxonomy.entries()].some(
			([taxSlug, terms]) =>
				terms.some((term) =>
					core.isResolving('getEntityRecord', [
						'taxonomy',
						taxSlug,
						term.id,
					]),
				),
		);

		return {
			post,
			termsByTaxonomy,
			allTerms,
			isLoading: isResolvingPost || isLoadingTerms,
		};
	}, [postType, postId]);
}
