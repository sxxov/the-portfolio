import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

export class StyleClipTheatreSchema extends TheatreSchema {
	static clip = types.compound(
		{
			tl: types.compound(
				{
					x: types.number(0, { label: 'X' }),
					y: types.number(0, { label: 'Y' }),
				},
				{ label: 'top left' },
			),
			tr: types.compound(
				{
					x: types.number(100, { label: 'X' }),
					y: types.number(0, { label: 'Y' }),
				},
				{ label: 'top right' },
			),
			bl: types.compound(
				{
					x: types.number(0, { label: 'X' }),
					y: types.number(100, { label: 'Y' }),
				},
				{ label: 'bottom left' },
			),
			br: types.compound(
				{
					x: types.number(100, { label: 'X' }),
					y: types.number(100, { label: 'Y' }),
				},
				{ label: 'bottom right' },
			),
		},
		{ label: 'clip (%)' },
	);
	clip = StyleClipTheatreSchema.clip;
}
