import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleBlurTheatreSchema extends TheatreSchema {
	static blur = types.number(0, {
		label: 'blur (px)',
	});
	blur = StyleBlurTheatreSchema.blur;
}
