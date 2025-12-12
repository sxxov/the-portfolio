import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleCenterFillTheatreSchema extends TheatreSchema {
	static centerFill = types.number(0, {
		label: 'center to viewport (%)',
		range: [0, 100],
	});
	centerFill = StyleCenterFillTheatreSchema.centerFill;
}
