import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleTransformScaleUniformTheatreSchema extends TheatreSchema {
	static scaleUniform = types.number(100, {
		label: 'scale (%)',
	});
	scaleUniform = StyleTransformScaleUniformTheatreSchema.scaleUniform;
}
