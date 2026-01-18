import {
	createPool,
	createProgress,
	createBar,
	createLoad,
	monitorDOM,
} from 'pawe/api';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */
/** @import { LoadSignal } from "pawe/api" */

const pool = createPool();
monitorDOM(document.body, pool);

const paweProgress = createProgress(pool);
export const progress = new Signal(paweProgress.get(), ({ set }) =>
	paweProgress.subscribe(set),
).readonly;

const paweBar = createBar(paweProgress);
export const progressBar = new Signal(paweBar.get(), ({ set }) =>
	paweBar.subscribe(set),
).readonly;

export function trackProgress01(
	/** @type {ReadableSignal<Ranged<0 | 1>>} */ signal,
) {
	const _ = bin();

	const load = new Signal(
		/** @type {LoadSignal | undefined} */ (undefined),
		({ set, subscribe: sub }) => {
			const _ = bin();

			_._ = signal.subscribe((it) => {
				if (it < 1) set(createLoad(pool));
			});

			_._ = sub((it) => () => { it?.finish(); });

			return _;
		},
	);

	_._ = subscribe({ value: signal, load }, ({ $value, $load }) => {
		$load?.set($value);
	});

	return _;
}

export function trackProgressBoolean(
	/** @type {ReadableSignal<boolean>} */ signal,
) {
	const _ = bin();

	const load = new Signal(
		/** @type {LoadSignal | undefined} */ (undefined),
		({ set, subscribe: sub }) => {
			const _ = bin();

			_._ = signal.subscribe((it) => {
				if (!it) set(createLoad(pool));
			});

			_._ = sub((it) => () => { it?.finish(); });

			return _;
		},
	);

	_._ = subscribe({ value: signal, load }, ({ $value, $load }) => {
		$load?.set($value ? 1 : 0);
	});

	return _;
}

export function trackProgressPromise(/** @type {PromiseLike<any>} */ promise) {
	const _ = bin();
	const load = createLoad(pool);
	_._ = () => { load.finish(); };

	let aborted = false;
	_._ = () => { aborted = true; };

	void promise.then(() => {
		if (aborted) return;

		load.set(1);
	});

	return _;
}
