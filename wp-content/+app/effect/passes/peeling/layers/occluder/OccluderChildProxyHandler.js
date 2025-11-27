import { Material } from 'three';
import { ChildProxyHandler } from '../../proxy/ChildProxyHandler.js';
import { InvisibleMaterial } from './shaders/InvisibleMaterial.js';
import { OccluderChildrenProxyHandler } from './OccluderChildrenProxyHandler.js';
/** @import {Mesh, Scene} from 'three' */

class MaterialInterception {
	/** @readonly */
	static predicate = /** @type {const} */ ({
		get: (
			/** @type {Mesh | Scene} */ o,
			/** @type {string | symbol} */ k,
			/** @type {unknown} */ value,
		) => value instanceof Material && value.transparent,
		visit: () => false,
		set: () => true,
	});
	predicate = MaterialInterception.predicate;

	/**
	 * @type {InvisibleMaterial | undefined}
	 * @protected
	 */
	material;
	get value() { return (this.material ??= new InvisibleMaterial()); }
	set value(v) { this.material = undefined; }
}

/**
 * @template {Mesh | Scene} T
 * @extends {ChildProxyHandler<T>}
 */
export class OccluderChildProxyHandler extends ChildProxyHandler {
	/** @protected @override */
	ChildrenProxyHandler = OccluderChildrenProxyHandler;

	/** @protected @override */
	interceptions =
		/** @type {const} @satisfies {ChildProxyHandler<T>['interceptions']} */ ({
			material: new MaterialInterception(),
		});
}
