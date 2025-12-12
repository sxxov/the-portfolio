import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';

/** @template {2 | 3} Dimensions */
export class StyleTransformRotationTheatreSchema extends TheatreSchema {
	static rotation2 = types.number(0, {
		label: 'rotation (deg)',
		nudgeMultiplier: 0.1,
	});
	static rotation3 = types.compound(
		{
			x: types.number(0, { nudgeMultiplier: 0.1 }),
			y: types.number(0, { nudgeMultiplier: 0.1 }),
			z: types.number(0, { nudgeMultiplier: 0.1 }),
		},
		{ label: 'rotation (deg)' },
	);

	constructor(/** @type {Dimensions} */ dimensions) {
		super();

		const { rotation2, rotation3 } = StyleTransformRotationTheatreSchema;
		this.rotation = /**
		 * @type {Dimensions extends 2 ? typeof rotation2
		 * 	: Dimensions extends 3 ? typeof rotation3
		 * 	: never}
		 */ (
			(() => {
				switch (dimensions) {
					case 2:
						return rotation2;
					case 3:
						return rotation3;
				}
			})()
		);
	}
}
