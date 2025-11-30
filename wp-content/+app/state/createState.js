import { derive, Signal } from '/+std/signal/Signal.js';
/** @import { StateAccumulation } from "./StateAccumulation.js" */

/** @template {StateAccumulation<any>} const T */
export function createState(/** @type {T['step'][]} */ sequence) {
	/** @typedef {Parameters<NonNullable<T['pass']>>[0]} Requirement */

	const index = new Signal(0);
	const step = index.derive(
		(i) => sequence[Math.max(0, Math.min(i, sequence.length - 1))],
	).readonly;
	/** @type {Requirement} */
	const accumulation = {};
	const accumulate = (/** @type {Requirement} */ requisite) => {
		if (!requisite) return;

		for (const [key, value] of Object.entries(requisite))
			accumulation[key] = value;
	};
	const pass = (/** @type {Requirement} */ requisite) => {
		accumulate(requisite);
		index.update((it) => it + 1);
	};
	const state = derive(
		{ step },
		({ $step }) =>
			/** @type {T} */ ({ step: $step, pass, ...accumulation }),
	);

	return state;
}
