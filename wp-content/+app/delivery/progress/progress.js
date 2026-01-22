import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
import { lerp } from '/+std/math/lerp.js';
import { clamp01 } from '/+std/math/clamp01.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */
/** @import { LoadSignal } from "pawe/api" */

const pool = new Signal(
	new /** @type {typeof Set<ReadableSignal<Ranged<0 | 1>>>} */ (Set)(),
);

export const progress = new Signal(0, ({ set, subscribe: sub }) => {
	const _ = bin();

	_._ = pool.subscribe(($loads) => {
		const { size } = $loads;
		if (size <= 0) {
			set(1);
			return;
		}

		const _ = bin();
		for (const load of $loads)
			_._ = load.subscribe(() => {
				const cum = $loads
					.values()
					.reduce((cum, it) => cum + it.get(), 0);
				const value = clamp01(cum / size);
				set(value);
			});

		return _;
	});

	_._ = sub(($progress) => {
		if ($progress >= 1)
			pool.update((it) => {
				if (it.size <= 0) return it;

				it.clear();
				pool.trigger();
				return it;
			});
	});

	return _;
}).readonly;
export const progressBar = new SmoothingSignal(
	progress.get(),
	{
		epsilon: 0.001,
		speedPerSecond: 67,
		smoothingFactor: 0.01,
	},
	({ set, seek }) =>
		subscribe({ progress }, ({ $progress }) => {
			if ($progress >= 1) {
				set(1);
				return;
			}

			if ($progress <= 0) seek(0);
			set(lerp($progress, 0.3, 1));
		}),
);

export function trackProgress01(
	/** @type {ReadableSignal<Ranged<0 | 1>>} */ load,
) {
	add: {
		pool.update(($loads) => {
			if ($loads.has(load)) return $loads;

			$loads.add(load);
			pool.trigger();
			return $loads;
		});
	}
	remove: return () => {
		pool.update(($loads) => {
			if (!$loads.has(load)) return $loads;

			$loads.delete(load);
			pool.trigger();
			return $loads;
		});
	};
}

export function trackProgressBoolean(
	/** @type {ReadableSignal<Ranged<0 | 1>>} */ load,
) {
	const numericLoad = load.derive((it) => (it ? 1 : 0));
	return trackProgress01(numericLoad);
}

export function trackProgressPromise(/** @type {PromiseLike<any>} */ promise) {
	const _ = bin();
	const controller = new AbortController();
	_._ = () => { controller.abort(); };
	const { signal } = controller;

	const load = new Signal(0);
	_._ = trackProgress01(load);

	void promise.then(() => {
		if (signal.aborted) return;

		load.set(1);
	});

	return _;
}
