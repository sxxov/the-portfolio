import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

/** @template {2 | 3} Dimensions */
export class StyleTransformPositionTheatreSchema extends TheatreSchema {
	static position2 = types.compound(
		{
			x: types.number(0),
			y: types.number(0),
		},
		{ label: 'position (vw/vh)' },
	);
	static position3 = types.compound(
		{
			x: types.number(0),
			y: types.number(0),
			z: types.number(0),
		},
		{ label: 'position (vw/vh/px)' },
	);

	constructor(/** @type {Dimensions} */ dimensions) {
		super();

		const { position2, position3 } = StyleTransformPositionTheatreSchema;
		this.position = /**
		 * @type {Dimensions extends 2 ? typeof position2
		 * 	: Dimensions extends 3 ? typeof position3
		 * 	: never}
		 */ (
			(() => {
				switch (dimensions) {
					case 2:
						return position2;
					case 3:
						return position3;
				}
			})()
		);
	}
}
