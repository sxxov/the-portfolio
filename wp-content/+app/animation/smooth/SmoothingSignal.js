import { clamp01 } from '/+std/math/clamp01.js';
import { map } from '/+std/math/map.js';
import { Signal } from '/+std/signal/Signal.js';
/** @import { Starter } from "/+std/signal/Signal.js" */

const windowed = typeof window !== 'undefined';

/** @extends {Signal<number>} */
export class SmoothingSignal extends Signal {
	/** @type {number} */
	smoothingFactor;
	/** @type {number} */
	speedPerSecond;

	/** @protected @type {number} */
	intrinsicValue;
	/** @protected @type {number} */
	smoothedValue;

	/** @private @type {ReturnType<typeof requestAnimationFrame> | undefined} */
	rafHandle;
	/** @private @type {DOMHighResTimeStamp | undefined} */
	rafTickPreviousTime;
	/** @private @type {number} */
	rafTickAccumulatedTime = 0;

	constructor(
		value = 0,
		/**
		 * @type {{
		 * 	smoothingFactor?: number;
		 * 	speedPerSecond?: number;
		 * 	epsilon?: number;
		 * }}
		 */ {
			smoothingFactor = 0.3,
			speedPerSecond = 1000,
			epsilon = 0.00001,
		} = {},
		/** @type {Starter<SmoothingSignal> | undefined} */ starter = undefined,
	) {
		super(value, /** @type {Starter<Signal<number>>} */ (starter));

		this.intrinsicValue = value;
		this.smoothedValue = value;

		this.smoothingFactor = smoothingFactor;
		this.speedPerSecond = speedPerSecond;
		this.epsilon = epsilon;
	}

	/** @override */
	set(/** @type {number} */ value) {
		this.intrinsicValue = value;

		if (windowed) {
			this.rafHandle ||= requestAnimationFrame(this.updateValueByTick);
		} else super.set(value);
	}

	seek(/** @type {number} */ value) {
		this.intrinsicValue = value;
		this.smoothedValue = value;
		super.set(value);
	}

	/** @override */
	destroy() {
		if (windowed)
			if (this.rafHandle) {
				cancelAnimationFrame(this.rafHandle);
				this.rafHandle = undefined;
			}

		super.destroy();
	}

	/** @private @readonly */
	updateValueByTick = (/** @type {DOMHighResTimeStamp} */ t) => {
		this.updateValueByTickImpl(t);
	};
	/** @private */
	updateValueByTickImpl(/** @type {DOMHighResTimeStamp} */ t) {
		if (this.rafHandle) {
			cancelAnimationFrame(this.rafHandle);
			this.rafHandle = undefined;
		}
		this.rafTickPreviousTime ||= t;

		const smoothingPerSecond = this.speedPerSecond * this.smoothingFactor;
		const speedPerMs = this.speedPerSecond / 1000;
		const delta = this.intrinsicValue - this.smoothedValue;
		const remainingDistance = Math.abs(delta);
		const slower = clamp01(
			map(remainingDistance, smoothingPerSecond, 0, 1, 0),
		);
		const sign = Math.sign(delta);

		const tickTargetMs = 1000 / 60;
		const tickDeltaMs = t - this.rafTickPreviousTime;
		this.rafTickPreviousTime = t;
		const increment = sign * speedPerMs * slower;

		this.rafTickAccumulatedTime += tickDeltaMs;
		let change = 0;
		while (this.rafTickAccumulatedTime >= tickTargetMs) {
			this.rafTickAccumulatedTime -= tickTargetMs;
			change += increment;
		}

		if (remainingDistance < this.epsilon) {
			this.smoothedValue = this.intrinsicValue;
			this.rafTickAccumulatedTime = 0;
			this.rafTickPreviousTime = undefined;
		} else {
			this.smoothedValue =
				sign > 0 ?
					Math.min(this.smoothedValue + change, this.intrinsicValue)
				:	Math.max(this.smoothedValue + change, this.intrinsicValue);

			if (windowed)
				this.rafHandle = requestAnimationFrame(this.updateValueByTick);
		}

		super.set(this.smoothedValue);
	}
}
