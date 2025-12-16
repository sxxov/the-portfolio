/** @import { Object3D } from "three" */

export function isParentInteracted(
	/** @type {Object3D} */ parent,
	/** @type {Object3D} */ child,
) {
	/** @type {Object3D | null} */
	let candidate = child;
	do {
		if (candidate === parent) return true;
	} while ((candidate = candidate.parent));
	return false;
}
