import { bin, Signal } from '/+std/signal/Signal.js';
/** @import { Point } from "/+std/unit/Point.js" */

export const pointers = new Signal(/** @type {Point[]} */ ([]), ({ set }) => {
	const _ = bin();

	const controller = new AbortController();
	_._ = () => { controller.abort(); };
	const { signal } = controller;

	const pointers = new /** @type {typeof Map<number, Point>} */ (Map)();
	const propagate = () => { set([...pointers.values()]); };

	const isInside = (/** @type {PointerEvent} */ e) =>
		e.clientX >= 0 &&
		e.clientY >= 0 &&
		e.clientX < innerWidth &&
		e.clientY < innerHeight;

	const onDown = (/** @type {PointerEvent} */ e) => {
		switch (e.pointerType) {
			case 'touch': {
				pointers.set(e.pointerId, {
					x: e.clientX,
					y: e.clientY,
				});
				propagate();
				break;
			}
			default:
		}
	};

	const onMove = (/** @type {PointerEvent} */ e) => {
		switch (e.pointerType) {
			case 'touch': {
				if (!pointers.has(e.pointerId)) break;

				pointers.set(e.pointerId, {
					x: e.clientX,
					y: e.clientY,
				});
				propagate();
				break;
			}
			case 'mouse': {
				if (isInside(e))
					pointers.set(e.pointerId, {
						x: e.clientX,
						y: e.clientY,
					});
				else pointers.delete(e.pointerId);
				propagate();
				break;
			}
			default:
		}
	};

	const onUpOrCancel = (/** @type {PointerEvent} */ e) => {
		pointers.delete(e.pointerId);
		propagate();
	};

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

	addEventListener('pointerdown', onDown, { passive: true, signal });
	addEventListener('pointermove', onMove, { passive: true, signal });
	addEventListener('pointerup', onUpOrCancel, { passive: true, signal });
	addEventListener('pointercancel', onUpOrCancel, { passive: true, signal });
	addEventListener('pointerleave', onLeave, { passive: true, signal });
	addEventListener(
		'blur',
		() => {
			pointers.clear();
			propagate();
		},
		{ signal },
	);

	return _;
}).readonly;
