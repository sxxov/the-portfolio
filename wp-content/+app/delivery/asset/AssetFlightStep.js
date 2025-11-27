/** @import { Values } from "/+std/type/object/Values.js" */

export const AssetFlightStep = /** @type {const} */ ({
	Idle: 'idle',

	Boarding: 'boarding',
	Flying: 'flying',
	Landed: 'landed',

	Falling: 'falling',
	Exploded: 'exploded',
});
/** @typedef {Values<typeof AssetFlightStep>} AssetFlightStep */
