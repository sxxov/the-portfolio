import { type PromiseSignal } from '/+std/signal/PromiseSignal.js';

export type AssetContainer<T = unknown> = {
	asset: PromiseSignal<T | undefined>;
};
