import { progress, progressBar } from '../progress.js';
import { SmoothingSignal } from '/+app/animation/smooth/SmoothingSignal.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { lerp } from '/+std/math/lerp.js';
import { subscribe } from '/+std/signal/Signal.js';

export const ProgressBehavior = behavior(
	'progress',
	class {
		'' = t.number.transient.styling.attributing.in(progress);
		done = t.boolean.transient.attributing.in(
			progress.derive((v) => v >= 1),
		);

		interpolated = t.number.transient.styling.attributing.default(0).in(
			new SmoothingSignal(
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
			),
		);
		interpolatedVisible = t.boolean.transient.attributing.in(
			this.interpolated.derive((v) => v > 0 && v < 1),
		);
		interpolatedText = t.string.transient.styling.attributing.in(
			this.interpolated.derive((v) => `${Math.round(v * 100)}`),
		);
	},
);
