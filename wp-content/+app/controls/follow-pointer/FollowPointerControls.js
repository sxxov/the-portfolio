import { Controls, Vector3 } from 'three';
import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
import { watchElementSize } from '/+std/dom/watchElementSize.js';
import { some } from '/+std/functional/some.js';
import { degToRad } from '/+std/math/degToRad.js';
import { bin, derive } from '/+std/signal/Signal.js';
/** @import { Camera, Object3D } from "three" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { Point } from "/+std/unit/Point.js" */

/** @extends {Controls<{}>} */
export class FollowPointerControls extends Controls {
	/** @protected @readonly */
	_ = bin();

	constructor(
		/** @type {Object3D} */ target,
		/** @type {Camera} */ camera,
		/** @type {HTMLElement} */ element,
		/** @type {ReadableSignal<Point | undefined>} */ pointer,
		/**
		 * @type {{
		 * 	rotationAmplitude?: { x: number; y: number };
		 * 	rotationRange?: number;
		 * 	rotationSampleCount?: number;
		 * 	rotationSpeed?: number;
		 * }}
		 */ {
			rotationAmplitude = { x: 100, y: 100 },
			rotationRange = 60,
			rotationSampleCount = 8,
			rotationSpeed = 1.5,
		} = {},
	) {
		super(target, element);

		const { _ } = this;
		const workingNdc = new Vector3();
		const workingCurrentPosition = new Vector3();
		const workingNextPosition = new Vector3();

		/** @type {Point | undefined} */
		let previousUv;
		/** @type {Point[]} */
		const directionStack = [];

		const size = watchElementSize(element);
		const uv = derive(
			{ pointer, size },
			({ $pointer, $size: { width, height } }) => {
				if (!$pointer || !some(width) || !some(height)) return;
				return { x: $pointer.x / width, y: $pointer.y / height };
			},
		);

		_._ = subscribeFrame((deltaTime) => {
			const $uv = uv.get();
			if (!$uv) return;

			target.getWorldPosition(workingCurrentPosition);
			const depth = workingCurrentPosition.project(camera).z;

			workingNdc.set($uv.x * 2 - 1, 1 - $uv.y * 2, depth);
			workingNextPosition.copy(workingNdc).unproject(camera);

			const { parent } = target;
			if (parent) parent.worldToLocal(workingNextPosition);

			target.position.copy(workingNextPosition);

			if (previousUv) {
				const direction = {
					x: $uv.x - previousUv.x,
					y: $uv.y - previousUv.y,
				};
				directionStack.push(direction);
				while (directionStack.length > rotationSampleCount)
					directionStack.shift();

				const averageDirection = directionStack.reduce(
					(acc, it) => {
						acc.x += it.x;
						acc.y += it.y;
						return acc;
					},
					{ x: 0, y: 0 },
				);
				averageDirection.x /= directionStack.length;
				averageDirection.y /= directionStack.length;

				const targetAngleX =
					averageDirection.x *
					rotationAmplitude.x *
					degToRad(rotationRange);
				const targetAngleY =
					averageDirection.y *
					rotationAmplitude.y *
					degToRad(rotationRange);

				const diffX = targetAngleX - target.rotation.y;
				const diffY = targetAngleY - target.rotation.x;
				const incrementX = diffX * (rotationSpeed / deltaTime);
				const incrementY = diffY * (rotationSpeed / deltaTime);

				target.rotation.y += incrementX;
				target.rotation.x += incrementY;
			}
			previousUv = $uv;
		});
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}
}
