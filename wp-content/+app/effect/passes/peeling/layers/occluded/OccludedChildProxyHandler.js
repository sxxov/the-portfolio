import { Material } from 'three';
import { ChildProxyHandler } from '../../proxy/ChildProxyHandler.js';
import { WhiteMaterial } from './shaders/WhiteMaterial.js';
import { OccludedChildrenProxyHandler } from './OccludedChildrenProxyHandler.js';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
/** @import { Mesh, Scene } from "three" */

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

class MaterialInterception {
	/** @readonly */
	static predicate = /** @type {const} */ ({
		get: (
			/** @type {Mesh | Scene} */ o,
			/** @type {string | symbol} */ k,
			/** @type {unknown} */ value,
		) =>
			!(o instanceof SplatMesh || o instanceof SparkRenderer) &&
			value instanceof Material &&
			value.transparent,
		visit: (
			/** @type {Mesh | Scene} */ o,
			/** @type {string | symbol} */ k,
			/** @type {unknown} */ value,
		) => this.predicate.get(o, k, value),
		set: () => true,
	});
	predicate = MaterialInterception.predicate;

	/**
	 * @type {WhiteMaterial | undefined}
	 * @protected
	 */
	material;
	get value() { return (this.material ??= new WhiteMaterial()); }
	set value(v) { this.material = undefined; }
}

/**
 * @template {Mesh | Scene} T
 * @extends {ChildProxyHandler<T>}
 */
export class OccludedChildProxyHandler extends ChildProxyHandler {
	/** @protected @override */
	ChildrenProxyHandler = OccludedChildrenProxyHandler;

	/** @protected @override */
	interceptions =
		/** @type {const} @satisfies {ChildProxyHandler<T>['interceptions']} */ ({
			children: new ChildrenInterception(),
			visible: new VisibleInterception(),
			material: new MaterialInterception(),
		});
}
