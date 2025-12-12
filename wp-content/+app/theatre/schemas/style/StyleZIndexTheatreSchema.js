import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleZIndexTheatreSchema extends TheatreSchema {
	static zIndex = types.number(0, {
		label: 'layer index',
		nudgeMultiplier: 1,
	});
	zIndex = StyleZIndexTheatreSchema.zIndex;
}
