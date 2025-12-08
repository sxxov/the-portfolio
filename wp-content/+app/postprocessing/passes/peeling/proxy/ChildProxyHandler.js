import { ChildrenProxyHandler } from './ChildrenProxyHandler.js';
import { some } from '/+std/functional/some.js';
/** @import { Object3D } from "three" */
/** @import { InterceptionPredicate } from "./InterceptionPredicate.js" */

/**
 * @abstract
 * @template {Object3D} [T=Object3D] Default is `Object3D`
 * @implements {ProxyHandler<T>}
 */
export class ChildProxyHandler {
	/**
	 * @typedef {{
	 * 	predicate: InterceptionPredicate<T, 'get' | 'visit' | 'set'>;
	 * 	value?: unknown;
	 * }} Interception
	 */

	/**
	 * @type {new () => ProxyHandler<Object3D[]>}
	 * @protected
	 */
	ChildrenProxyHandler = ChildrenProxyHandler;

	/**
	 * @type {Object3D[] | undefined}
	 * @protected
	 */
	children;

	/**
	 * @type {Partial<
	 * 	Record<keyof T, Interception> | Record<string | symbol, Interception>
	 * >}
	 * @readonly
	 * @protected
	 */
	interceptions = {};

	get(
		/** @type {T} */ o,
		/** @type {string | symbol} */ k,
		/** @type {{}} */ r,
	) {
		/** @type {unknown} */
		let value = Reflect.get(o, k, r);

		const interception =
			this.interceptions[
				/** @type {keyof typeof this.interceptions} */ (k)
			];
		if (interception) {
			const {
				predicate: { get: shouldReplaceGet, visit: shouldVisit },
			} = interception;
			if (shouldReplaceGet?.(o, k, value, r)) value = interception.value;
			if (some(shouldVisit) && !shouldVisit(o, k, value, r)) return value;
		}

		if (typeof value !== 'object' || value === null) return value;
		if (k === 'children')
			return (this.children ??= new Proxy(
				/** @type {any} */ (value),
				new this.ChildrenProxyHandler(),
			));

		return value;
	}
	set(
		/** @type {T} */ o,
		/** @type {string | symbol} */ k,
		/** @type {unknown} */ v,
		/** @type {{}} */ r,
	) {
		const interception =
			this.interceptions[
				/** @type {keyof typeof this.interceptions} */ (k)
			];
		if (interception) {
			const {
				predicate: { set: shouldInterceptSet },
			} = interception;
			if (shouldInterceptSet?.(o, k, v, r)) {
				interception.value = v;
				return true;
			}
		}

		// clear children cache & fallthrough to set onto the target
		if (k === 'children') this.children = undefined;

		return Reflect.set(o, k, v, r);
	}
}
