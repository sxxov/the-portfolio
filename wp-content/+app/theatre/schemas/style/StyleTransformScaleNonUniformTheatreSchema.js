import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

/** @template {2 | 3} Dimensions */
export class StyleTransformScaleNonUniformTheatreSchema extends TheatreSchema {
	static scaleNonUniform2 = types.compound(
		{
			x: types.number(100),
			y: types.number(100),
		},
		{ label: 'scale (%)' },
	);
	static scaleNonUniform3 = types.compound(
		{
			x: types.number(100),
			y: types.number(100),
			z: types.number(100),
		},
		{ label: 'scale (%)' },
	);

	constructor(/** @type {Dimensions} */ dimensions) {
		super();

		const { scaleNonUniform2, scaleNonUniform3 } =
			StyleTransformScaleNonUniformTheatreSchema;
		this.scaleNonUniform = /**
		 * @type {Dimensions extends 2 ? typeof scaleNonUniform2
		 * 	: Dimensions extends 3 ? typeof scaleNonUniform3
		 * 	: never}
		 */ (
			(() => {
				switch (dimensions) {
					case 2:
						return scaleNonUniform2;
					case 3:
						return scaleNonUniform3;
				}
			})()
		);
	}
}
