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

	static scale = types.number(1, { nudgeMultiplier: 0.01 });
	scale = ThreeTransformTheatreSchema.scale;

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
		o.scale.x = scale;
		o.scale.y = scale;
		o.scale.z = scale;
	};
}
