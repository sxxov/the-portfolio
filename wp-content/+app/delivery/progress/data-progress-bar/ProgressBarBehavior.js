import { ProgressBehavior } from '../data-progress/ProgressBehavior.js';
import { attachBehavior, behavior, t } from '/+std/behavioral/behavior.js';

export const ProgressBarBehavior = behavior(
	'progress-bar',
	class {
		align = t.string.choices('start', 'center', 'end').default('start');
		direction = t.number.styling.choices(-1, 1).default(1);
		axis = t.string.choices('x', 'y').default('x');
	},
	(element) => attachBehavior(element, ProgressBehavior),
);
