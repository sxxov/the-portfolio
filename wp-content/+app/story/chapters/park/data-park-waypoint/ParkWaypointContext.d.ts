import { type ReadableSignal } from '/+std/signal/Signal.js';

export type ParkWaypointContext = {
	name: string;
	model: string;
	hovering: ReadableSignal<boolean>;
};
