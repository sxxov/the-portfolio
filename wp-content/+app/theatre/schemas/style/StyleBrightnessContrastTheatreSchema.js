import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleBrightnessContrastTheatreSchema extends TheatreSchema {
	static brightnessContrast = types.compound(
		{
			brightness: types.number(100, { label: 'brightness (%)' }),
			contrast: types.number(100, { label: 'contrast (%)' }),
		},
		{ label: 'brightness/contrast' },
	);
	brightnessContrast =
		StyleBrightnessContrastTheatreSchema.brightnessContrast;
}
