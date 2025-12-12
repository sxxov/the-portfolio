import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleOpacityTheatreSchema extends TheatreSchema {
	static opacity = types.number(100, {
		label: 'opacity (%)',
		range: [0, 100],
	});
	opacity = StyleOpacityTheatreSchema.opacity;
}
