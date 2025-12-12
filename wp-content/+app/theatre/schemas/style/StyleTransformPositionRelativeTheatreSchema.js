import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

/** @template {2 | 3} Dimensions */
export class StyleTransformPositionRelativeTheatreSchema extends TheatreSchema {
	static positionRelative2 = types.compound(
		{
			x: types.number(0),
			y: types.number(0),
		},
		{ label: 'position (%)' },
	);
	static positionRelative3 = types.compound(
		{
			x: types.number(0),
			y: types.number(0),
			z: types.number(0),
		},
		{ label: 'position (%)' },
	);

	constructor(/** @type {Dimensions} */ dimensions) {
		super();

		const { positionRelative2, positionRelative3 } =
			StyleTransformPositionRelativeTheatreSchema;
		this.positionRelative = /**
		 * @type {Dimensions extends 2 ? typeof positionRelative2
		 * 	: Dimensions extends 3 ? typeof positionRelative3
		 * 	: never}
		 */ (
			(() => {
				switch (dimensions) {
					case 2:
						return positionRelative2;
					case 3:
						return positionRelative3;
				}
			})()
		);
	}
}
