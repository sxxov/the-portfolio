import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleVisibilityTheatreSchema extends TheatreSchema {
	static visibility = types.stringLiteral(
		'visible',
		{
			visible: 'visible',
			hidden: 'hidden',
			collapse: 'collapse',
		},
		{ as: 'switch' },
	);
	visibility = StyleVisibilityTheatreSchema.visibility;
}
