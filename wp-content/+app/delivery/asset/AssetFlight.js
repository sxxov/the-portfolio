/* eslint-disable complexity */
import { createState } from '/+app/state/createState.js';
import { AssetFlightStep } from './AssetFlightStep.js';
import { coerceError } from '/+std/error/coerceError.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { TaskSignal } from '/+std/signal/TaskSignal.js';
/** @import { AssetFlightState } from "./AssetFlightState.js" */
/** @import { AssetTicket } from "./AssetTicket.js" */

/**
 * Wrapper for an asset being fetched & processed.
 *
 * @template [T=unknown] Default is `unknown`
 */
export class AssetFlight {
	/** @readonly */
	ticket;
	attempt = 0;
	/** @readonly */
	flying = new Signal(false, ({ subscribe: sub }) =>
		sub((it) => {
			if (!it) return;

			return this.depart();
		}),
	);
	/**
	 * @type {Signal<AssetFlightState<T>>}
	 * @readonly
	 */
	state = new Signal({ step: AssetFlightStep.Idle });

	constructor(/** @type {AssetTicket<T>} */ ticket) {
		this.ticket = ticket;
	}

	/**
	 * @private
	 * @type {Signal<AssetFlightState<T>> | undefined}
	 */
	flyingState;
	/** @private */
	resetFlyingState() {
		this.flyingState?.destroy();
		this.flyingState = createState([
			AssetFlightStep.Boarding,
			AssetFlightStep.Flying,
			AssetFlightStep.Landed,
		]);
		this.state.in(this.flyingState);
	}

	/** @private */
	depart() {
		const { state, ticket } = this;
		const { url, pipe, asset } = ticket;

		const _ = bin();

		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		_._ = subscribe({ state }, async ({ $state }) => {
			const _ = bin();
			const { step } = $state;

			switch (step) {
				// init
				case AssetFlightStep.Idle: {
					this.attempt++;
					this.resetFlyingState();
					break;
				}

				// flying
				case AssetFlightStep.Boarding: {
					const { pass } = $state;
					try {
						const response = await fetch(url, { signal });
						if (!response.ok)
							throw new Error(
								`Failed to fetch asset: (${response.status}) ${response.statusText}`,
							);
						const total = (() => {
							const it = Number(
								response.headers.get('content-length'),
							);
							if (!Number.isFinite(it) || it <= 0)
								return undefined;
							return it;
						})();
						const etag = response.headers.get('etag') || undefined;

						const reader = response.body?.getReader();
						if (!reader) {
							state.set({
								step: AssetFlightStep.Falling,
								reason: new Error('No response body'),
							});
							break;
						}

						if (signal.aborted) break;

						const chunks = new Signal(
							/** @type {Uint8Array[]} */ ([]),
						);
						const received = chunks.derive((it) =>
							it.reduce((a, { byteLength }) => a + byteLength, 0),
						);
						const asset = new TaskSignal(
							/** @type {T | undefined} */ (undefined),
							({ set }) =>
								subscribe({ chunks }, async ({ $chunks }) => {
									set(await pipe($chunks));
								}),
						);
						pass({
							total,
							etag,

							response,
							reader,
							chunks,
							received,

							asset,
						});
					} catch (error) {
						if (signal.aborted) break;
						state.set({
							step: AssetFlightStep.Falling,
							reason: coerceError(error),
						});
						break;
					}
					break;
				}
				case AssetFlightStep.Flying: {
					const { pass, reader, chunks, asset: value } = $state;

					try {
						for (;;) {
							if (signal.aborted) break;
							const { done, value } = await reader.read();
							if (done) break;
							chunks.update((it) => {
								it.push(value);
								chunks.trigger();
								return it;
							});
						}
					} catch (error) {
						if (signal.aborted) break;
						state.set({
							step: AssetFlightStep.Falling,
							reason: coerceError(error),
						});
						break;
					}
					if (signal.aborted) break;

					value.set(await pipe(chunks.get()));
					pass();
					break;
				}
				case AssetFlightStep.Landed: {
					const { asset: value } = $state;
					asset.resolve(value.get());
					break;
				}

				// edge cases
				case AssetFlightStep.Falling: {
					const { reason } = $state;
					if (this.attempt > 3) {
						state.set({
							step: AssetFlightStep.Exploded,
							reason,
						});
						break;
					}
					state.set({ step: AssetFlightStep.Idle });
					break;
				}
				case AssetFlightStep.Exploded: {
					const { reason } = $state;
					asset.reject(reason);
					// TODO: show a toast or some UI feedback about failing assets
					// eslint-disable-next-line no-console
					console.error('Asset flight exploded', reason);
					break;
				}
			}

			return _;
		});

		return _;
	}
}
