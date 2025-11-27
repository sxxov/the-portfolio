import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { ChildProxyHandler } from '../../proxy/ChildProxyHandler.js';
import { ForegroundChildrenProxyHandler } from './ForegroundChildrenProxyHandler.js';
/** @import {Mesh, Scene} from 'three' */

class ChildrenInterception {
	/** @readonly */
	static predicate = /** @type {const} */ ({
		visit: (/** @type {Mesh | Scene} */ o) =>
			!(o instanceof SplatMesh || o instanceof SparkRenderer),
	});
	predicate = ChildrenInterception.predicate;
}

class VisibleInterception {
	/** @readonly */
	static predicate = /** @type {const} */ ({
		get: (/** @type {Mesh | Scene} */ o) =>
			o instanceof SplatMesh || o instanceof SparkRenderer,
	});
	predicate = VisibleInterception.predicate;
	value = false;
}

/**
 * @template {Mesh | Scene} T
 * @extends {ChildProxyHandler<T>}
 */
export class ForegroundChildProxyHandler extends ChildProxyHandler {
	/** @protected @override */
	ChildrenProxyHandler = ForegroundChildrenProxyHandler;

	/** @protected @override */
	interceptions =
		/** @type {const} @satisfies {ChildProxyHandler<T>['interceptions']} */ ({
			children: new ChildrenInterception(),
			visible: new VisibleInterception(),
		});
}
