import { SmoothingSignal } from '../../smooth/SmoothingSignal.js';
import { watchElementHovering } from '/+app/dom/watchElementHovering.js';
import { pointers } from '/+app/human/pointers.js';
import { subscribeFrame } from '/+std/animation/subscribeFrame.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { setStyles } from '/+std/dom/setStyles.js';
import { bin, derive, Signal, subscribe } from '/+std/signal/Signal.js';
import { viewportSize } from '/+std/viewport/viewportSize.js';
/** @import { Point } from "/+std/unit/Point.js" */

export const ApproachPointerBehavior = behavior(
	'approach-pointer',
	class {
		amplitude = t.number.default(0.2);
		radius = t.number.default(20);
	},
	(element, { radius, amplitude }, {}) => {
		const _ = bin();

		const vmax = viewportSize.derive(({ width: vw, height: vh }) =>
			Math.max(vw, vh),
		);
		const radiusPx = derive(
			{ radius, vmax },
			({ $radius, $vmax }) => ($radius / 100) * $vmax,
		);
		const hovering = watchElementHovering(element);
		const time = new Signal(0, ({ update }) =>
			subscribeFrame((deltaTime) => {
				update((time) => time + deltaTime);
			}),
		);
		const movement = derive(
			{ pointers, radiusPx, amplitude, hovering, time },
			({ $pointers, $radiusPx, $amplitude, $hovering }) => {
				if ($pointers.size <= 0) return;
				if ($hovering) return;

				const { translate } = element.style;
				setStyles(element, { translate: '' });
				const { x, y, width, height } = element.getBoundingClientRect();
				setStyles(element, { translate });

				const closest = $pointers.values().reduce(
					(context, pointer) => {
						const direction = {
							x: pointer.x - (x + width / 2),
							y: pointer.y - (y + height / 2),
						};
						const distance = Math.hypot(direction.x, direction.y);
						if (distance > $radiusPx) return context;
						if (!context || distance < context.distance)
							return { pointer, direction, distance };
						return context;
					},
					/**
					 * @type {{
					 * 			pointer: Point;
					 * 			direction: Point;
					 * 			distance: number;
					 * 	  }
					 * 	| undefined}
					 */ (undefined),
				);
				if (!closest) return;

				const { direction, distance } = closest;
				const strength =
					Math.max(
						0,
						$radiusPx - distance - Math.max(width, height),
					) * $amplitude;

				const translateX = (direction.x / distance) * strength;
				const translateY = (direction.y / distance) * strength;

				return { x: translateX, y: translateY };
			},
		);
		const smoothedMovement = derive({
			x: new SmoothingSignal(
				0,
				{ smoothingFactor: 0.02, speedPerSecond: 3000 },
				({ set }) =>
					movement.subscribe((it) => {
						if (!it) return;
						set(it.x);
					}),
			),
			y: new SmoothingSignal(
				0,
				{ smoothingFactor: 0.02, speedPerSecond: 3000 },
				({ set }) =>
					movement.subscribe((it) => {
						if (!it) return;
						set(it.y);
					}),
			),
		});

		_._ = smoothedMovement.subscribe(({ x, y }) => {
			setStyles(element, { translate: `${x}px ${y}px` });
			return () => { setStyles(element, { translate: '' }); };
		});

		return _;
	},
);
