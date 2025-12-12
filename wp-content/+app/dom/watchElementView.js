import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
import { watchElementRect } from '/+std/dom/watchElementRect.js';
import { some } from '/+std/functional/some.js';
import { clamp01 } from '/+std/math/clamp01.js';
import { map01 } from '/+std/math/map01.js';
import { Signal } from '/+std/signal/Signal.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';

/**
 * @typedef {{ x: ViewAxis<number>; y: ViewAxis<number> }
 * 	| { x: ViewAxis<undefined>; y: ViewAxis<undefined> }} View
 */

/** @template T */
class ViewAxis {
	constructor(
		/** @type {T} */ absolute,
		/** @type {ViewInOutBetween<T>} */ progress,
		/** @type {boolean} */ visible,
	) {
		this.absolute = absolute;
		this.progress = progress;
		this.visible = visible;
	}

	toValue() { return this.progress.toValue(); }
}

/** @template T */
class ViewInOutBetween {
	constructor(
		/** @type {T} */ in0in1,
		/** @type {T} */ out0out1,
		/** @type {T} */ in0out0,
		/** @type {T} */ in1out1,
		/** @type {T} */ in1out0,
		/** @type {T} */ in0out1,
		/** @type {T} */ top0in1,
		/** @type {T} */ top1out1,
	) {
		this.in = in0in1;
		this.out = out0out1;
		this.left = in0out0;
		this.leftAligned = top0in1;
		this.right = in1out1;
		this.rightAligned = top1out1;
		this.middle = in1out0;
		this.all = in0out1;
	}

	toValue() { return this.all; }
}

export function watchElementView(/** @type {HTMLElement} */ element) {
	const rect = watchElementRect(element);
	const view = new Signal(
		/** @type {View} */ ({
			x: new ViewAxis(
				undefined,
				new ViewInOutBetween(
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				),
				false,
			),
			y: new ViewAxis(
				undefined,
				new ViewInOutBetween(
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
					undefined,
				),
				false,
			),
		}),
		({ get, set }) =>
			// eslint-disable-next-line complexity
			subscribeFrame(() => {
				const {
					x: $left,
					y: $top,
					width: $width,
					height: $height,
				} = rect.get();
				const { width: $vw, height: $vh } = viewportSize.get();
				if (
					!some($left) ||
					!some($top) ||
					!some($width) ||
					!some($height) ||
					!$vw ||
					!$vh
				)
					return;

				const in0X = $left - $vw;
				const in0Y = $top - $vh;
				const in1X = $left - $vw + Math.min($width, $vw);
				const in1Y = $top - $vh + Math.min($height, $vh);

				const out0X = $left + Math.max($width - $vw, 0);
				const out0Y = $top + Math.max($height - $vh, 0);
				const out1X = $left + $width;
				const out1Y = $top + $height;

				const top0X = $left - $vw;
				const top0Y = $top - $vh;
				const top1X = $left;
				const top1Y = $top;

				const in0In1X = clamp01(map01(window.scrollX, in0X, in1X));
				const in0In1Y = clamp01(map01(window.scrollY, in0Y, in1Y));
				const out0Out1X = clamp01(map01(window.scrollX, out0X, out1X));
				const outOut0Out1Y = clamp01(
					map01(window.scrollY, out0Y, out1Y),
				);
				const in1Out0ProgressX = clamp01(
					map01(window.scrollX, in1X, out0X),
				);
				const in1Out0ProgressY = clamp01(
					map01(window.scrollY, in1Y, out0Y),
				);
				const in0Out1X = clamp01(map01(window.scrollX, in0X, out1X));
				const in0Out1Y = clamp01(map01(window.scrollY, in0Y, out1Y));
				const in0Out0X = clamp01(map01(window.scrollX, in0X, out0X));
				const in0Out0Y = clamp01(map01(window.scrollY, in0Y, out0Y));
				const in1Out1X = clamp01(map01(window.scrollX, in1X, out1X));
				const in1Out1Y = clamp01(map01(window.scrollY, in1Y, out1Y));

				const top0In1X = clamp01(map01(window.scrollX, top0X, in1X));
				const top0In1Y = clamp01(map01(window.scrollY, top0Y, in1Y));
				const top1Out1X = clamp01(map01(window.scrollX, top1X, out1X));
				const top1Out1Y = clamp01(map01(window.scrollY, top1Y, out1Y));

				const absoluteX = window.scrollX - $left;
				const absoluteY = window.scrollY - $top;

				const visibleX =
					window.scrollX + $vw > $left &&
					window.scrollX < $left + $width;
				const visibleY =
					window.scrollY + $vh > $top &&
					window.scrollY < $top + $height;

				const $view = get();
				let changed = false;

				if ($view.x.absolute !== absoluteX) {
					changed = true;
					$view.x.absolute = absoluteX;
				}
				if ($view.y.absolute !== absoluteY) {
					changed = true;
					$view.y.absolute = absoluteY;
				}

				if ($view.x.progress.in !== in0In1X) {
					changed = true;
					$view.x.progress.in = in0In1X;
				}
				if ($view.y.progress.in !== in0In1Y) {
					changed = true;
					$view.y.progress.in = in0In1Y;
				}

				if ($view.x.progress.out !== out0Out1X) {
					changed = true;
					$view.x.progress.out = out0Out1X;
				}
				if ($view.y.progress.out !== outOut0Out1Y) {
					changed = true;
					$view.y.progress.out = outOut0Out1Y;
				}

				if ($view.x.progress.middle !== in1Out0ProgressX) {
					changed = true;
					$view.x.progress.middle = in1Out0ProgressX;
				}
				if ($view.y.progress.middle !== in1Out0ProgressY) {
					changed = true;
					$view.y.progress.middle = in1Out0ProgressY;
				}

				if ($view.x.progress.all !== in0Out1X) {
					changed = true;
					$view.x.progress.all = in0Out1X;
				}
				if ($view.y.progress.all !== in0Out1Y) {
					changed = true;
					$view.y.progress.all = in0Out1Y;
				}

				if ($view.x.progress.left !== in0Out0X) {
					changed = true;
					$view.x.progress.left = in0Out0X;
				}
				if ($view.y.progress.left !== in0Out0Y) {
					changed = true;
					$view.y.progress.left = in0Out0Y;
				}

				if ($view.x.progress.right !== in1Out1X) {
					changed = true;
					$view.x.progress.right = in1Out1X;
				}
				if ($view.y.progress.right !== in1Out1Y) {
					changed = true;
					$view.y.progress.right = in1Out1Y;
				}

				if ($view.x.progress.leftAligned !== top0In1X) {
					changed = true;
					$view.x.progress.leftAligned = top0In1X;
				}
				if ($view.y.progress.leftAligned !== top0In1Y) {
					changed = true;
					$view.y.progress.leftAligned = top0In1Y;
				}

				if ($view.x.progress.rightAligned !== top1Out1X) {
					changed = true;
					$view.x.progress.rightAligned = top1Out1X;
				}
				if ($view.y.progress.rightAligned !== top1Out1Y) {
					changed = true;
					$view.y.progress.rightAligned = top1Out1Y;
				}

				if ($view.x.visible !== visibleX) {
					changed = true;
					$view.x.visible = visibleX;
				}
				if ($view.y.visible !== visibleY) {
					changed = true;
					$view.y.visible = visibleY;
				}

				if (changed) set({ ...$view });
			}),
	);

	return view;
}
