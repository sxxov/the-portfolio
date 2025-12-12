import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
import { scrollX, scrollY } from '/+std/human/scroll.js';
import { bin, Signal } from '/+std/signal/Signal.js';
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */

const x = new Signal(0, ({ update }) => start(update, scrollX));
const y = new Signal(0, ({ update }) => start(update, scrollY));

export const scrollVelocityX = x.readonly;
export const scrollVelocityY = y.readonly;

function start(
	/** @type {(v: (v: number) => number) => void} */ update,
	/** @type {ReadableSignal<number>} */ signal,
) {
	let previousScroll = signal.get();
	let previousTime = performance.now();

	const _ = bin();

	accumulate: {
		_._ = signal.subscribe(($scroll) => {
			const currentTime = performance.now();
			const deltaTime = currentTime - previousTime;
			const delta = $scroll - previousScroll;
			const velocity = deltaTime > 0 ? delta / deltaTime : 0;

			update(
				(previousVelocity) => previousVelocity * 0.8 + velocity * 0.2,
			);

			previousScroll = $scroll;
			previousTime = currentTime;
		});
	}

	decay: {
		const epsilon = 0.001;
		_._ = subscribeFrame((deltaTime) => {
			update((previousVelocity) => {
				if (Math.abs(previousVelocity) < epsilon) return 0;

				const decayFactor = 0.9 ** (deltaTime / 1000 / (1 / 60));
				return previousVelocity * decayFactor;
			});
		});
	}

	return _;
}
