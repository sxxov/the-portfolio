// the code here is a bit spaghetti. make sure to check `AssetFlight` for more
// of the implementation

import { trackProgress01 } from '../progress/progress.js';
import { AssetFlight } from './AssetFlight.js';
import { AssetFlightStep } from './AssetFlightStep.js';
import { AssetPriority } from './AssetPriority.js';
import { RushablePromiseSignal } from './RushablePromiseSignal.js';
import { some } from '/+std/functional/some.js';
import { PromiseSignalStatus } from '/+std/signal/PromiseSignal.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { TaskSignal } from '/+std/signal/TaskSignal.js';
import { unwrap } from '/+std/type/utilities/unwrap.js';
/** @import { AssetContainer } from "./AssetContainer.js" */
/** @import { AssetTicket } from "./AssetTicket.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */

export const assetContainers =
	new /** @type {typeof Map<string, AssetContainer<any>>} */ (Map)();
export const assetFlights =
	new /** @type {typeof WeakMap<AssetTicket, AssetFlight>} */ (WeakMap)();
export const assetQueue = new TaskSignal(
	/** @type {AssetTicket<any>[]} */ ([]),
);
subscribe({ assetQueue }, ({ $assetQueue }) => {
	const ticketContexts = $assetQueue
		.map((it) => {
			let score = 0;
			let flight = assetFlights.get(it);
			if (!flight) {
				flight = new AssetFlight(it);
				assetFlights.set(it, flight);
			}

			const $flying = flight.flying.get();
			if ($flying) score += 2;

			const $step = flight.state.get().step;
			if ($step === AssetFlightStep.Landed) score += -Infinity;

			switch (it.priority) {
				case AssetPriority.High:
					score += 10;
					break;
				case AssetPriority.Normal:
					score += 1;
					break;
				case AssetPriority.Deferred:
					score += 0;
					break;
			}

			return /** @type {const} */ ([it, { flight, score }]);
		})
		.filter(([, { score }]) => score > 0)
		.sort(([, a], [, b]) => b.score - a.score);

	const maxDepartingCount = 16;
	const departingCount = Math.min(ticketContexts.length, maxDepartingCount);

	// depart tickets' flights
	for (let i = 0; i < departingCount; i++) {
		const [, { flight }] = unwrap(ticketContexts[i]);
		flight.flying.set(true);
	}

	// suspend de-prioritized tickets' flights
	for (let i = departingCount; i < ticketContexts.length; i++) {
		const [, { flight }] = unwrap(ticketContexts[i]);
		flight.flying.set(false);
	}
});

const assetProgresses = new Signal(
	new /** @type {typeof Map<AssetTicket, number>} */ (Map)(),
	({ update, trigger }) =>
		subscribe({ assetQueue }, ({ $assetQueue }) => {
			const _ = bin();

			for (const ticket of $assetQueue) {
				const flight = assetFlights.get(ticket);
				if (!flight) continue;

				const set = (/** @type {number | undefined} */ value) => {
					update((it) => {
						const currentValue = it.get(ticket);
						if (Signal.compare(currentValue, value)) return it;

						if (some(value)) it.set(ticket, value);
						else it.delete(ticket);

						trigger();
						return it;
					});
				};

				const { state } = flight;
				_._ = subscribe({ state }, ({ $state }) => {
					const _ = bin();
					const { step } = $state;

					switch (step) {
						case AssetFlightStep.Idle:
						case AssetFlightStep.Boarding:
						case AssetFlightStep.Falling:
							set(0);
							break;
						case AssetFlightStep.Landed:
							set(1);
							break;
						case AssetFlightStep.Exploded:
							set(undefined);
							break;
						case AssetFlightStep.Flying: {
							const { total, received } = $state;
							if (!some(total)) {
								set(0.75);
								break;
							}

							_._ = subscribe({ received }, ({ $received }) => {
								set($received / total);
							});
						}
					}

					return _;
				});
			}

			return _;
		}),
);
export const assetProgress = new Signal(
	/** @type {Ranged<0 | 1>} */ (0),
	({ set }) =>
		subscribe({ assetProgresses }, ({ $assetProgresses }) => {
			const progresses = [...$assetProgresses.values().filter(some)];

			const { length } = progresses;
			if (length <= 0) {
				set(0);
				return;
			}

			const amount =
				progresses.reduce((cum = 0, it = 0) => cum + it, 0) ?? 0;
			set(amount / length);
		}),
);
trackProgress01(assetProgress);

/** @typedef {{ priority?: AssetPriority }} RequestAssetOptions */

/** @template T */
export function requestAsset(
	/** @type {string} */ url,
	/** @type {(chunks: Uint8Array[]) => T | Promise<T>} */ pipe,
	/** @type {RequestAssetOptions} */ { priority = AssetPriority.Normal } = {},
) {
	const normalizedUrl = new URL(url, location.href).href;

	/** @type {AssetContainer<T> | undefined} */
	let container = assetContainers.get(normalizedUrl);
	if (!container) {
		const rush = () => {
			assetQueue.update((it) => {
				ticket.priority = AssetPriority.High;
				assetQueue.trigger();
				return it;
			});
		};
		const asset = new RushablePromiseSignal(
			/** @type {T | undefined} */ (undefined),
			rush,
			({ subscribeState }) =>
				subscribeState(({ status }) => {
					if (status === PromiseSignalStatus.Pending) return;

					assetQueue.update((it) => {
						it.splice(
							it.findIndex((it) => it === ticket),
							1,
						);
						assetQueue.trigger();
						return it;
					});
				}),
		);
		/** @type {AssetTicket<T>} */
		const ticket = {
			url: normalizedUrl,
			priority,
			pipe,
			asset,
		};
		assetQueue.update((it) => {
			it.push(ticket);
			assetQueue.trigger();
			return it;
		});

		container = { asset };
		assetContainers.set(normalizedUrl, container);
	}

	return container;
}
