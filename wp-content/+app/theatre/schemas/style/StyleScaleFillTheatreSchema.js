import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleScaleFillTheatreSchema extends TheatreSchema {
	static scaleFill = types.number(0, {
		label: 'scale to fill viewport (%)',
		range: [0, 100],
	});
	scaleFill = StyleScaleFillTheatreSchema.scaleFill;

	static scaleFillClip = types.boolean(false, {
		label: 'clip overflow',
	});
	scaleFillClip = StyleScaleFillTheatreSchema.scaleFillClip;
}
