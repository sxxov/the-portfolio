import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { ChildrenProxyHandler } from '../../proxy/ChildrenProxyHandler.js';
import { BackgroundChildProxyHandler } from './BackgroundChildProxyHandler.js';
/** @import {Object3D} from 'three' */

class Interception {
	/** @protected @readonly */
	static predicate = /** @type {const} */ ({
		visit: (
			/** @type {Object3D[]} */ o,
			/** @type {string | symbol} */ k,
			/** @type {unknown} */ value,
		) => !(value instanceof SplatMesh) && !(value instanceof SparkRenderer),
	});
	predicate = Interception.predicate;
}

export class BackgroundChildrenProxyHandler extends ChildrenProxyHandler {
	/** @protected @override */
	ChildProxyHandler = BackgroundChildProxyHandler;

	/** @protected @override */
	interception = new Interception();
}
