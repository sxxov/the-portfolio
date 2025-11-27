import { Controls, Object3D, Vector3 } from 'three';
import { mouse } from '../../human/mouse.js';
import { SmoothingSignal } from '../smooth/SmoothingSignal.js';
import { degToRad } from '/+std/math/degToRad.js';
import { bin, derive } from '/+std/signal/Signal.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
/** @import { Camera } from "three" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { ISheetObject, UnknownShorthandCompoundProps } from "@theatre/core" */
/** @import { TheatreValue } from "../../theatre/types/TheatreValue.js" */

const vmax = viewportSize.derive(({ width: vw, height: vh }) =>
	Math.max(vw, vh),
);
const ndc = derive({
	x: new SmoothingSignal(0, {
		smoothingFactor: 0.03,
		speedPerSecond: 3000,
	}).in(
		derive(
			{ mouse, viewportSize, vmax },
			({ $mouse: { x }, $viewportSize: { width: vw }, $vmax }) =>
				(x - vw / 2) / ($vmax / 2),
		),
	),
	y: new SmoothingSignal(0, {
		smoothingFactor: 0.03,
		speedPerSecond: 3000,
	}).in(
		derive(
			{ mouse, viewportSize, vmax },
			({ $mouse: { y }, $viewportSize: { height: vh }, $vmax }) =>
				(y - vh / 2) / ($vmax / 2),
		),
	),
});

/** @extends {Controls<{}>} */
export class HoverOrbitControls extends Controls {
	/** @private @readonly */
	_ = bin();

	/** Rotation radius in radians */
	radius = degToRad(45);
	/** Local target position relative to the object's parent */
	target = new Vector3(0, 0, 0);

	/** @private @readonly */
	measurerRoot = new Object3D();
	/** @private @readonly */
	measurerRootWorldPosition = new Vector3();
	/** @private @readonly */
	measurer = (() => {
		const it = new Object3D();
		this.measurerRoot.add(it);
		return it;
	})();

	constructor(
		/** @type {Camera} */ object,
		/** @type {HTMLElement | null | undefined} */ domElement = undefined,
	) {
		super(object, domElement);
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}

	/** @override */
	update(/** @type {number} */ delta) {
		super.update(delta);
		const { x, y } = ndc.get();

		const { radius } = this;
		const polarAngle = y * radius;
		const azimuthAngle = x * radius;

		const {
			target,
			object,
			measurer,
			measurerRoot,
			measurerRootWorldPosition,
		} = this;
		const { parent } = object;

		measurerRoot.position.x = target.x;
		measurerRoot.position.y = target.y;
		measurerRoot.position.z = target.z;

		measurerRoot.rotation.x = polarAngle;
		measurerRoot.rotation.y = azimuthAngle;
		measurerRoot.rotation.z = 0;

		parent?.add(measurerRoot);

		measurerRoot.updateWorldMatrix(true, false);
		measurerRoot.getWorldPosition(measurerRootWorldPosition);

		measurer.position.x = -target.x;
		measurer.position.y = -target.y;
		measurer.position.z = -target.z;

		object.position.x = 0;
		object.position.y = 0;
		object.position.z = 0;

		object.rotation.x = 0;
		object.rotation.y = 0;
		object.rotation.z = 0;

		measurer.add(object);
		parent?.attach(object);

		object.lookAt(
			measurerRootWorldPosition.x,
			measurerRootWorldPosition.y,
			measurerRootWorldPosition.z,
		);
	}
}
