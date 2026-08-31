import { progress, progressBar } from '../progress.js';
import { behavior, t } from '/+std/behavioral/behavior.js';

export const ProgressBehavior = behavior(
	'progress',
	class {
		'' = t.number.transient.styling.attributing.in(progress);
		done = t.boolean.transient.attributing.in(
			progress.derive((v) => v >= 1),
		);

		interpolated = t.number.transient.styling.attributing
			.default(0)
			.in(progressBar);
		interpolatedVisible = t.boolean.transient.attributing.in(
			this.interpolated.derive((v) => v > 0 && v < 1),
		);
		interpolatedText = t.string.transient.styling.attributing.in(
			this.interpolated.derive((v) => `${Math.round(v * 100)}`),
		);
	},
);
