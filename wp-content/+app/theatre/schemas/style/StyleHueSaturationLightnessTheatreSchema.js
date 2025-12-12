import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleHueSaturationLightnessTheatreSchema extends TheatreSchema {
	static hueSaturationLightness = types.compound(
		{
			hue: types.number(0, { label: 'hue (deg)' }),
			saturation: types.number(100, { label: 'saturation (%)' }),
			lightness: types.number(100, { label: 'lightness (%)' }),
		},
		{ label: 'hue/saturation/lightness' },
	);
	hueSaturationLightness =
		StyleHueSaturationLightnessTheatreSchema.hueSaturationLightness;
}
