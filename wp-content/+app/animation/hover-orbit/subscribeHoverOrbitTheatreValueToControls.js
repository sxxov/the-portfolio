import { degToRad } from '/+std/math/degToRad.js';
import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { HoverOrbitTheatreSchema } from "./HoverOrbitTheatreSchema.js" */
/** @import { TheatreValue } from "/+app/theatre/types/TheatreValue.js" */
/** @import { HoverOrbitControls } from "./HoverOrbitControls.js" */

export function subscribeHoverOrbitTheatreValueToControls(
	/**
	 * @type {ReadableSignal<
	 * 	TheatreValue<HoverOrbitTheatreSchema> | undefined
	 * >}
	 */ value,
	/** @type {HoverOrbitControls} */ controls,
) {
	return subscribeFrame(() => {
		const $value = value.get();
		if (!$value) return;

		const { radius, target } = $value;
		controls.radius = degToRad(radius);
		controls.target.x = target.x;
		controls.target.y = target.y;
		controls.target.z = target.z;
	});
}
