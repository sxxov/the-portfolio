import { PromiseSignal } from '/+std/signal/PromiseSignal.js';
/** @import { Starter } from "/+std/signal/Signal.js" */

/**
 * @template T
 * @extends {PromiseSignal<T>}
 */
export class RushablePromiseSignal extends PromiseSignal {
	/** @type {(() => void) | undefined} */
	rusher;

	constructor(
		/** @type {T} */ value,
		/** @type {(() => void) | undefined} */ onRush = undefined,
		/** @type {Starter<PromiseSignal<T>> | undefined} */ onStart = undefined,
	) {
		super(value, onStart);
		this.rusher = onRush;
	}

	/**
	 * @template [TResult1=T] Default is `T`
	 * @template [TResult2=never] Default is `never`
	 * @returns {Promise<TResult1 | TResult2>}
	 * @override
	 */
	async then(
		/**
		 * @type {((value: T) => TResult1 | PromiseLike<TResult1>)
		 * 	| undefined
		 * 	| null}
		 */ onfulfilled = undefined,
		/**
		 * @type {((reason: any) => TResult2 | PromiseLike<TResult2>)
		 * 	| undefined
		 * 	| null}
		 */ onrejected = undefined,
	) {
		this.rusher?.();
		return super.then(onfulfilled, onrejected);
	}
}
