import { ProgressBehavior } from '../data-progress/ProgressBehavior.js';
import { progress } from '../progress.js';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
import { attachBehavior, behavior, t } from '/+std/behavioral/behavior.js';
import { lerp } from '/+std/math/lerp.js';
import { subscribe } from '/+std/signal/Signal.js';

export const ProgressBarBehavior = behavior(
	'progress-bar',
	class {
		bar = new SmoothingSignal(
			progress.get(),
			{
				epsilon: 0.001,
				speedPerSecond: 67,
				smoothingFactor: 0.01,
			},
			({ set, seek }) =>
				subscribe({ progress }, ({ $progress }) => {
					if ($progress >= 1) {
						set(1);
						return;
					}

					if ($progress <= 0) seek(0);
					set(lerp($progress, 0.3, 1));
				}),
		);
		progress = t.number.transient.styling.attributing.in(this.bar);
		visible = t.boolean.transient.attributing.in(
			this.bar.derive((v) => v > 0 && v < 1),
		);
	},
	(element) => { attachBehavior(element, ProgressBehavior); },
);
