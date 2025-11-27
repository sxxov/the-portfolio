import { types } from '@theatre/core';
/** @import { TheatreSchema } from "/+app/theatre/types/TheatreSchema.js" */

export const HoverOrbitTheatreSchema = /**
 * @type {const}
 * @satisfies {TheatreSchema}
 */ ({
	radius: types.number(45, {
		nudgeMultiplier: 1,
		label: 'radius (deg)',
	}),
	target: types.compound({
		x: types.number(0, { nudgeMultiplier: 0.01 }),
		y: types.number(0, { nudgeMultiplier: 0.01 }),
		z: types.number(0, { nudgeMultiplier: 0.01 }),
	}),
});
/** @typedef {typeof HoverOrbitTheatreSchema} HoverOrbitTheatreSchema */
