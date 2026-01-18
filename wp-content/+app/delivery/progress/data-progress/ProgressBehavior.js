import { progress, progressBar } from '../progress.js';
import { behavior, t } from '/+std/behavioral/behavior.js';

export const ProgressBehavior = behavior(
	'progress',
	class {
		'' = t.number.transient.styling.attributing.in(progress);
		interpolated = t.number.transient.styling.attributing.in(progressBar);
		string = t.string.transient.styling.attributing.in(
			progressBar.derive((v) => `'${Math.round(v * 100)}'`),
		);
		done = t.boolean.transient.attributing.in(
			progress.derive((v) => v >= 1),
		);
	},
);
