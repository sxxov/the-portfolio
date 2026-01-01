import { addFilter } from '/+std/@wordpress/hooks.js';
import { x } from '/+std/react/x.js';
/** @import { BlockEditProps, BlockInstance } from "@wordpress/blocks" */

addFilter(
	'editor.BlockEdit',
	'app/monkey/post-terms-query/additional-context',
	(BlockEdit) =>
		(
			/**
			 * @type {BlockEditProps<{ query?: Record<string, any> }> &
			 * 	BlockInstance<{}>}
			 */ props,
		) => {
			if (props.name !== 'core/terms-query') return x(BlockEdit, props);

			const { attributes, context } = props;
			if (attributes.query)
				attributes.query['post_id'] = context['postId'];

			return x(BlockEdit, {
				key: 'edit',
				...props,
				attributes,
			});
		},
);
