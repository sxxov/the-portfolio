import { ChildProxyHandler } from './ChildProxyHandler.js';
import { some } from '/+std/functional/some.js';
/** @import { Object3D } from "three" */
/** @import { InterceptionPredicate } from "./InterceptionPredicate.js" */

/**
 * @abstract
 * @implements {ProxyHandler<Object3D[]>}
 */
export class ChildrenProxyHandler {
	/**
	 * @typedef {{
	 * 	predicate: InterceptionPredicate<Object3D[], 'get' | 'visit'>;
	 * 	value?: unknown;
	 * }} Interception
	 */

	/**
	 * @type {new () => ProxyHandler<Object3D>}
	 * @protected
	 */
	ChildProxyHandler = ChildProxyHandler;

	/**
	 * @type {Map<string | symbol, any>}
	 * @protected
	 */
	proxies = new Map();

	/**
	 * @type {Interception | undefined}
	 * @protected
	 * @readonly
	 */
	interception;

	get(
		/** @type {Object3D[]} */ o,
		/** @type {string | symbol} */ k,
		/** @type {{}} */ r,
	) {
		/** @type {unknown} */
		let value = Reflect.get(o, k, r);

		const { interception } = this;
		if (interception) {
			const {
				predicate: { get: shouldReplaceGet, visit: shouldVisit },
			} = interception;
			if (shouldReplaceGet?.(o, k, value, r)) value = interception.value;
			if (some(shouldVisit) && !shouldVisit(o, k, value, r)) return value;
		}

		if (typeof value !== 'object' || value === null) return value;
		let proxy = this.proxies.get(k);
		if (!proxy || proxy !== value) {
			proxy = new Proxy(value, new this.ChildProxyHandler());
			this.proxies.set(k, proxy);
		}
		return proxy;
	}
}
