import { types } from '@theatre/core';
import { TheatreSchema } from '../../types/TheatreSchema.js';
import { degToRad } from '/+std/math/degToRad.js';
/** @import { Object3D } from "three" */
/** @import { TheatreValue } from "../../types/TheatreValue.js" */

export class ThreeTransformTheatreSchema extends TheatreSchema {
	static position = types.compound({
		x: types.number(0, { nudgeMultiplier: 0.01 }),
		y: types.number(0, { nudgeMultiplier: 0.01 }),
		z: types.number(0, { nudgeMultiplier: 0.01 }),
	});
	position = ThreeTransformTheatreSchema.position;

	static rotation = types.compound({
		x: types.number(0, { nudgeMultiplier: 0.1 }),
		y: types.number(0, { nudgeMultiplier: 0.1 }),
		z: types.number(0, { nudgeMultiplier: 0.1 }),
	});
	rotation = ThreeTransformTheatreSchema.rotation;

	static scaleUniform = types.number(1, { nudgeMultiplier: 0.01 });
	static scaleNonUniform = types.compound({
		x: types.number(1, { nudgeMultiplier: 0.01 }),
		y: types.number(1, { nudgeMultiplier: 0.01 }),
		z: types.number(1, { nudgeMultiplier: 0.01 }),
	});

	constructor(
		/** @type {{ scaleNonUniform?: boolean }} */ {
			scaleNonUniform = false,
		} = {},
	) {
		super();

		if (scaleNonUniform)
			this.scale = ThreeTransformTheatreSchema.scaleNonUniform;
		else this.scale = ThreeTransformTheatreSchema.scaleUniform;
	}

	static writeMesh = (
		/** @type {TheatreValue<ThreeTransformTheatreSchema>} */ {
			position,
			rotation,
			scale,
		},
		/** @type {Object3D} */ o,
	) => {
		o.position.x = position.x;
		o.position.y = position.y;
		o.position.z = position.z;

		o.rotation.x = degToRad(rotation.x);
		o.rotation.y = degToRad(rotation.y);
		o.rotation.z = degToRad(rotation.z);

		if (typeof scale === 'number') {
			o.scale.x = scale;
			o.scale.y = scale;
			o.scale.z = scale;
		} else {
			o.scale.x = scale.x;
			o.scale.y = scale.y;
			o.scale.z = scale.z;
		}
	};
}
