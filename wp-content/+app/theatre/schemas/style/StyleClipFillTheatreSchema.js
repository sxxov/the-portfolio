import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleClipFillTheatreSchema extends TheatreSchema {
	static clipFill = types.number(0, {
		label: 'clip to fill viewport (%)',
		range: [0, 100],
	});
	clipFill = StyleClipFillTheatreSchema.clipFill;
}
