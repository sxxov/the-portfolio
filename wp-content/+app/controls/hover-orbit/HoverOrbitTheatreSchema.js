import { types } from '@theatre/core';
import { TheatreSchema } from '/+app/theatre/types/TheatreSchema.js';
import { degToRad } from '/+std/math/degToRad.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { TheatreValue } from "/+app/theatre/types/TheatreValue.js" */
/** @import { HoverOrbitControls } from "./HoverOrbitControls.js" */

export class HoverOrbitTheatreSchema extends TheatreSchema {
	static radius = types.number(45, {
		nudgeMultiplier: 1,
		label: 'radius (deg)',
	});
	radius = HoverOrbitTheatreSchema.radius;

	static target = types.compound({
		x: types.number(0, { nudgeMultiplier: 0.01 }),
		y: types.number(0, { nudgeMultiplier: 0.01 }),
		z: types.number(0, { nudgeMultiplier: 0.01 }),
	});
	target = HoverOrbitTheatreSchema.target;

	static writeControls = (
		/** @type {TheatreValue<HoverOrbitTheatreSchema>} */ { radius, target },
		/** @type {HoverOrbitControls} */ controls,
	) => {
		controls.radius = degToRad(radius);
		controls.target.x = target.x;
		controls.target.y = target.y;
		controls.target.z = target.z;
	};
}
