import { type AssetFlightStep } from './AssetFlightStep.js';
import { type StateAccumulation } from '/+app/state/StateAccumulation.js';
import { type ReadableSignal, type Signal } from '/+std/signal/Signal.js';

export type AssetFlightState<T> =
	| {
			step: typeof AssetFlightStep.Idle;
	  }
	| StateAccumulation<
			[
				{
					step: typeof AssetFlightStep.Boarding;
					requisite: {
						total: number | undefined;
						etag: string | undefined;

						response: Response;
						reader: ReadableStreamDefaultReader<Uint8Array>;
						chunks: Signal<Uint8Array[]>;
						received: ReadableSignal<number>;

						asset: Signal<T | undefined>;
					};
				},
				{
					step: typeof AssetFlightStep.Flying;
				},
				{
					step: typeof AssetFlightStep.Landed;
				},
			]
	  >
	| {
			step: typeof AssetFlightStep.Falling;
			reason: Error;
	  }
	| {
			step: typeof AssetFlightStep.Exploded;
			reason: Error;
	  };
