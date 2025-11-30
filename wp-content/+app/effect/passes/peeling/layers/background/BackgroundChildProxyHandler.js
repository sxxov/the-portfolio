import { ChildProxyHandler } from '../../proxy/ChildProxyHandler.js';
import { BackgroundChildrenProxyHandler } from './BackgroundChildrenProxyHandler.js';
import { Mesh } from 'three';
/** @import { Scene } from "three" */

class VisibleInterception {
	/** @readonly */
	static predicate = /** @type {const} */ ({
		get: (/** @type {Mesh | Scene} */ o) => o instanceof Mesh,
	});
	predicate = VisibleInterception.predicate;
	value = false;
}

/**
 * @template {Mesh | Scene} T
 * @extends {ChildProxyHandler<T>}
 */
export class BackgroundChildProxyHandler extends ChildProxyHandler {
	/** @protected @override */
	ChildrenProxyHandler = BackgroundChildrenProxyHandler;

	/** @protected @override */
	interceptions =
		/** @type {const} @satisfies {ChildProxyHandler<T>['interceptions']} */ ({
			visible: new VisibleInterception(),
		});
}
