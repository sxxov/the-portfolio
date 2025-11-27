import { ProgressBehavior } from '../data-progress/ProgressBehavior.js';
import { attachBehavior, behavior } from '/+std/behavioral/behavior.js';
import { bin } from '/+std/signal/Signal.js';

export const ProgressBarBehavior = behavior(
	'progress-bar',
	class {},
	(element) => {
		const _ = bin();

		_._ = attachBehavior(element, ProgressBehavior);

		return _;
	},
);
