import { clamp } from '/+std/math/clamp.js';
import { clamp01 } from '/+std/math/clamp01.js';
import { map } from '/+std/math/map.js';
import { map01 } from '/+std/math/map01.js';
import { bin, Signal } from '/+std/signal/Signal.js';
/** @import { Point } from "/+std/unit/Point.js" */

/** @extends {Signal<ReadonlySet<Point>>} */
export class PointersSignal extends Signal {
	constructor(/** @type {HTMLElement | undefined} */ element) {
		super(new Set(), ({ set }) => {
			const _ = bin();

			const controller = new AbortController();
			_._ = () => { controller.abort(); };
			const { signal } = controller;

			const pointers = new /** @type {typeof Map<number, Point>} */ (
				Map
			)();
			const propagate = () => { set(new Set(pointers.values())); };
			const write = (
				/** @type {Point} */ pointer,
				/** @type {number} */ clientX,
				/** @type {number} */ clientY,
			) => {
				if (!element) {
					pointer.x = clientX;
					pointer.y = clientY;
					return;
				}

				const { x, y, width, height } = element.getBoundingClientRect();
				const u = clamp01(map01(clientX, x, x + width)) * width;
				const v = clamp01(map01(clientY, y, y + height)) * height;

				pointer.x = u;
				pointer.y = v;
			};

			const on =
				element?.addEventListener.bind(element) ??
				window.addEventListener.bind(window);

			const onDown = (/** @type {PointerEvent} */ e) => {
				switch (e.pointerType) {
					case 'touch': {
						let pointer = pointers.get(e.pointerId);
						if (!pointer) {
							pointer = { x: 0, y: 0 };
							pointers.set(e.pointerId, pointer);
						}
						write(pointer, e.clientX, e.clientY);
						propagate();
						break;
					}
					default:
				}
			};
			on('pointerenter', onDown, {
				passive: true,
				signal,
			});
			on('pointerdown', onDown, {
				passive: true,
				signal,
			});

			const onMove = (/** @type {PointerEvent} */ e) => {
				switch (e.pointerType) {
					case 'touch': {
						const pointer = pointers.get(e.pointerId);
						if (!pointer) break;
						write(pointer, e.clientX, e.clientY);
						propagate();
						break;
					}
					case 'mouse': {
						let pointer = pointers.get(e.pointerId);
						if (!pointer) {
							pointer = { x: 0, y: 0 };
							pointers.set(e.pointerId, pointer);
						}
						write(pointer, e.clientX, e.clientY);
						propagate();
						break;
					}
					default:
				}
			};
			on('pointermove', onMove, {
				passive: true,
				signal,
			});

			const onUp = (/** @type {PointerEvent} */ e) => {
				switch (e.pointerType) {
					case 'touch': {
						pointers.delete(e.pointerId);
						propagate();
						break;
					}
					default:
				}
			};
			on('pointerup', onUp, {
				passive: true,
				signal,
			});
			on('pointercancel', onUp, {
				passive: true,
				signal,
			});

			const onLeave = (/** @type {PointerEvent} */ e) => {
				switch (e.pointerType) {
					case 'mouse': {
						pointers.delete(e.pointerId);
						propagate();
						break;
					}
					default:
				}
			};
			on('pointerleave', onLeave, {
				passive: true,
				signal,
			});
			on('pointercancel', onLeave, {
				passive: true,
				signal,
			});

			const onBlur = () => {
				pointers.clear();
				propagate();
			};
			on('blur', onBlur, { signal });

			return _;
		});
	}
}

export const pointers = new PointersSignal(undefined).readonly;
