import { ChildrenProxyHandler } from '../../proxy/ChildrenProxyHandler.js';
import { OccludedChildProxyHandler } from './OccludedChildProxyHandler.js';
/** @import { Object3D } from "three" */

export class OccludedChildrenProxyHandler extends ChildrenProxyHandler {
	/** @protected @override */
	ChildProxyHandler = OccludedChildProxyHandler;
}
