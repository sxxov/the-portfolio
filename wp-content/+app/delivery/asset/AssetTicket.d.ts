import { type AssetPriority } from './AssetPriority.js';
import { type PromiseSignal } from '/+std/signal/PromiseSignal.js';

export type AssetTicket<T = unknown> = {
	readonly url: string;
	priority: AssetPriority;
	pipe: (chunks: Uint8Array[]) => T | Promise<T>;
	asset: PromiseSignal<T | undefined>;
};
