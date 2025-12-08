import { ChildrenProxyHandler } from '../../proxy/ChildrenProxyHandler.js';
import { ForegroundChildProxyHandler } from './ForegroundChildProxyHandler.js';
/** @import { Object3D } from "three" */

export class ForegroundChildrenProxyHandler extends ChildrenProxyHandler {
	/** @protected @override */
	ChildProxyHandler = ForegroundChildProxyHandler;
}
