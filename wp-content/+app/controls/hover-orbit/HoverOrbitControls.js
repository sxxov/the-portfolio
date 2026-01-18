import { Controls, Object3D, Vector3 } from 'three';
import { SmoothingSignal } from '../../animation/smooth/SmoothingSignal.js';
import { PointersSignal } from '/+app/human/pointers.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { some } from '/+std/functional/some.js';
import { degToRad } from '/+std/math/degToRad.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { Camera } from "three" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { ISheetObject, UnknownShorthandCompoundProps } from "@theatre/core" */
/** @import { TheatreValue } from "../../theatre/types/TheatreValue.js" */

/** @extends {Controls<{}>} */
export class HoverOrbitControls extends Controls {
	/** @private @readonly */
	_ = bin();

	/** @private @readonly */
	radiusSignal = new Signal(degToRad(45));
	/** Rotation radius in radians */
	get radius() { return this.radiusSignal.get(); }
	set radius(v) { this.radiusSignal.set(v); }

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
		/** @type {Camera} */ camera,
		/** @type {HTMLElement} */ domElement,
	) {
		super(camera, domElement);

		const { _ } = this;

		const pointers = new PointersSignal(domElement);
		const rect = watchElementRect(domElement);
		const sizeMax = rect.derive(({ width, height }) =>
			some(width) && some(height) ? Math.max(width, height) : undefined,
		);
		const ndc = derive(
			{ pointers, rect, sizeMax },
			({ $pointers: [$pointer], $rect: { width, height }, $sizeMax }) => {
				if (
					!some($pointer) ||
					!some($sizeMax) ||
					!some(width) ||
					!some(height)
				)
					return { x: 0, y: 0 };

				return {
					x: ($pointer.x - width / 2) / ($sizeMax / 2),
					y: ($pointer.y - height / 2) / ($sizeMax / 2),
				};
			},
		);
		const angles = derive({
			azimuth: new SmoothingSignal(
				0,
				{
					smoothingFactor: 0.03,
					speedPerSecond: 1000,
				},
				({ set }) =>
					subscribe(
						{ ndc, radius: this.radiusSignal },
						({ $ndc: { x }, $radius }) => { set(x * $radius); },
					),
			),
			polar: new SmoothingSignal(
				0,
				{
					smoothingFactor: 0.03,
					speedPerSecond: 1000,
				},
				({ set }) =>
					subscribe(
						{ ndc, radius: this.radiusSignal },
						({ $ndc: { y }, $radius }) => { set(y * $radius); },
					),
			),
		});
		_._ = angles.subscribe((it) => { this.angles = it; });
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}

	/** @override */
	update(/** @type {number} */ delta) {
		super.update(delta);

		const { polar: polarAngle, azimuth: azimuthAngle } = this.angles;

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
