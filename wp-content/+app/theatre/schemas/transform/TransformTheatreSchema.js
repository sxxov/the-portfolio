import { types } from '@theatre/core';
/** @import { TheatreSchema } from "/+app/theatre/types/TheatreSchema.js" */

export const TransformTheatreSchema = /**
 * @type {const}
 * @satisfies {TheatreSchema}
 */ ({
	position: types.compound({
		x: types.number(0, { nudgeMultiplier: 0.01 }),
		y: types.number(0, { nudgeMultiplier: 0.01 }),
		z: types.number(0, { nudgeMultiplier: 0.01 }),
	}),
	rotation: types.compound({
		x: types.number(0, { nudgeMultiplier: 0.1 }),
		y: types.number(0, { nudgeMultiplier: 0.1 }),
		z: types.number(0, { nudgeMultiplier: 0.1 }),
	}),
	scale: types.number(1, { nudgeMultiplier: 0.01 }),
});
/** @typedef {typeof TransformTheatreSchema} TransformTheatreSchema */
