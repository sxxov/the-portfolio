import { Controls } from 'three';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
import { bezierQuintOut } from '/+std/animation/bezier/beziers.js';
import { watchElementSize } from '/+std/dom/watchElementSize.js';
import { some } from '/+std/functional/some.js';
import { degToRad } from '/+std/math/degToRad.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
/** @import { Object3D } from "three" */
/** @import { ReadableSignal } from "/+std/signal/Signal.js" */
/** @import { InteractionContainer } from "../interactivity/InteractionContainer.js" */
/** @import { Point } from "/+std/unit/Point.js" */
/** @import { Ranged } from "/+std/unit/Ranged.js" */

/** @extends {Controls<{}>} */
export class PeekControls extends Controls {
	/** @typedef {'x' | 'y' | 'z'} SwizzleChar */
	/** @typedef {`${SwizzleChar}${SwizzleChar}${SwizzleChar}`} SwizzleString */

	/** @protected @readonly */
	_ = bin();

	constructor(
		/** @type {Object3D} */ target,
		/** @type {HTMLElement} */ element,
		/** @type {ReadableSignal<Iterable<Point>>} */ pointers,
		/**
		 * @type {{
		 * 	swizzle?: SwizzleString;
		 * 	amplitude?: { x: number; y: number };
		 * 	range?: number;
		 * 	resistanceBezier?: (t: Ranged<0 | 1>) => number;
		 * 	movementSpeed?: number;
		 * }}
		 */ {
			swizzle = 'xyz',
			amplitude = { x: 1, y: 1 },
			range = 90,
			resistanceBezier = bezierQuintOut,
			movementSpeed = 1,
		} = {},
	) {
		super(target, element);

		const { _ } = this;

		const size = watchElementSize(element);
		const aspectAxes = derive({ size }, ({ $size: { width, height } }) => {
			if (!some(width) || !some(height)) return { x: 1, y: 1 };
			if (width >= height) return { x: 1, y: height / width };
			return { x: width / height, y: 1 };
		});
		const pointerList = derive({ pointers }, ({ $pointers }) => [
			...$pointers,
		]);
		const holding = pointerList.derive(
			($pointersList) => $pointersList.length > 0,
		);

		/** @type {Map<Point, Readonly<Point>>} */
		const pointerInitials = new Map();
		_._ = holding.subscribe(() => { pointerInitials.clear(); });

		const pointerMovements = new Signal(
			/** @type {Map<Point, Point>} */ (new Map()),
			({ update, trigger }) =>
				subscribe({ pointerList }, ({ $pointerList }) => {
					for (const pointer of pointerInitials.keys()) {
						if ($pointerList.some((it) => it === pointer)) continue;

						pointerInitials.delete(pointer);
					}

					for (const pointer of $pointerList) {
						let initial = pointerInitials.get(pointer);
						if (!initial) {
							initial = { ...pointer };
							pointerInitials.set(pointer, initial);
						}

						const diffX = pointer.x - initial.x;
						const diffY = pointer.y - initial.y;

						update(($movements) => {
							let movement = $movements.get(pointer);
							if (!movement) {
								movement = { x: 0, y: 0 };
								$movements.set(pointer, movement);
							}

							movement.x = diffX;
							movement.y = diffY;

							trigger();
							return $movements;
						});
					}
				}),
		);
		_._ = holding.subscribe(() => { pointerMovements.get().clear(); });

		const pointerMovementUv = derive(
			{ pointerMovements, size, holding },
			({ $pointerMovements, $size: { width, height }, $holding }) => {
				if (!some(width) || !some(height)) return;
				if (!$holding) return;

				const cum = $pointerMovements.values().reduce(
					(acc, curr) => {
						acc.x += curr.x;
						acc.y += curr.y;
						return acc;
					},
					{ x: 0, y: 0 },
				);
				const uv = {
					x: cum.x / width,
					y: cum.y / height,
				};

				return uv;
			},
		);
		const targetRotation = derive(
			{ pointerMovementUv, aspectAxes },
			({ $pointerMovementUv, $aspectAxes }) => {
				if (!$pointerMovementUv) return;

				return {
					x:
						Math.sign($pointerMovementUv.y) *
						resistanceBezier(
							Math.abs($pointerMovementUv.y * amplitude.y),
						) *
						degToRad(range) *
						$aspectAxes.y,
					y:
						Math.sign($pointerMovementUv.x) *
						resistanceBezier(
							Math.abs($pointerMovementUv.x * amplitude.x),
						) *
						degToRad(range) *
						$aspectAxes.x,
				};
			},
		);

		const applyTargetRotation = (
			/** @type {number} */ x,
			/** @type {number} */ y,
		) => {
			switch (swizzle[0]) {
				case 'x':
					target.rotation.x = x;
					break;
				case 'y':
					target.rotation.x = y;
					break;
				case 'z':
					target.rotation.z = 0;
					break;
				default:
			}
			switch (swizzle[1]) {
				case 'x':
					target.rotation.y = x;
					break;
				case 'y':
					target.rotation.y = y;
					break;
				case 'z':
					target.rotation.z = 0;
					break;
				default:
			}
			switch (swizzle[2]) {
				case 'x':
					target.rotation.z = x;
					break;
				case 'y':
					target.rotation.z = y;
					break;
				case 'z':
					target.rotation.z = 0;
					break;
				default:
			}
		};
		_._ = subscribe(
			{
				x: new SmoothingSignal(
					0,
					{
						smoothingFactor: 0.01,
						speedPerSecond: movementSpeed * 1_000,
					},
					({ set }) =>
						targetRotation.subscribe((it) => { set(it?.x ?? 0); }),
				),
				y: new SmoothingSignal(
					0,
					{
						smoothingFactor: 0.01,
						speedPerSecond: movementSpeed * 1_000,
					},
					({ set }) =>
						targetRotation.subscribe((it) => { set(it?.y ?? 0); }),
				),
			},
			({ $x, $y }) => { applyTargetRotation($x, $y); },
		);
	}

	/** @override */
	dispose() {
		super.dispose();
		this._();
	}
}
