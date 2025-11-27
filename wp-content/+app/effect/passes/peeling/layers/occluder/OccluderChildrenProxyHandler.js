import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { ChildrenProxyHandler } from '../../proxy/ChildrenProxyHandler.js';
import { OccluderChildProxyHandler } from './OccluderChildProxyHandler.js';
/** @import {Object3D} from 'three' */

class Interception {
	/** @protected @readonly */
	static predicate = {
		visit: (
			/** @type {Object3D[]} */ o,
			/** @type {string | symbol} */ k,
			/** @type {unknown} */ value,
		) => !(value instanceof SplatMesh) && !(value instanceof SparkRenderer),
	};
	predicate = Interception.predicate;
}

export class OccluderChildrenProxyHandler extends ChildrenProxyHandler {
	/** @protected @override */
	ChildProxyHandler = OccluderChildProxyHandler;

	/** @protected @override */
	interception = new Interception();
}
