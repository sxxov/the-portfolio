import { degToRad } from '/+std/math/degToRad.js';
import { subscribe } from '/+std/signal/Signal.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Object3D } from "three" */
/** @import { TransformTheatreSchema } from "./TransformTheatreSchema.js" */
/** @import { TheatreValue } from "/+app/theatre/types/TheatreValue.js" */

export function subscribeTransformTheatreValueToMesh(
	/**
	 * @type {ReadableSignal<
	 * 	TheatreValue<TransformTheatreSchema> | undefined
	 * >}
	 */ value,
	/** @type {Object3D} */ mesh,
) {
	return subscribe({ value }, ({ $value }) => {
		if (!$value) return;

		const { position, rotation, scale } = $value;
		const it = mesh;
		it.position.x = position.x;
		it.position.y = position.y;
		it.position.z = position.z;
		it.rotation.x = degToRad(rotation.x);
		it.rotation.y = degToRad(rotation.y);
		it.rotation.z = degToRad(rotation.z);
		it.scale.x = scale;
		it.scale.y = scale;
		it.scale.z = scale;
	});
}
