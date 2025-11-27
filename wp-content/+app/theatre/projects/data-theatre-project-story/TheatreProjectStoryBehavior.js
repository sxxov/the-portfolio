import { TheatreProjectBehavior } from '../../data-theatre-project/TheatreProjectBehavior.js';
import state from './state.json' with { type: 'json' };
import {
	attachBehavior,
	behavior,
	getAttachedBehavior,
} from '/+std/behavioral/behavior.js';
import { bin } from '/+std/signal/Signal.js';

export const TheatreProjectStoryBehavior = behavior(
	'theatre-project-story',
	class {},
	(element, {}, {}) => {
		const _ = bin();

		_._ = attachBehavior(element, TheatreProjectBehavior, { '': 'story' });
		const project = getAttachedBehavior(element, TheatreProjectBehavior);
		_._ = project.subscribe((it) => { it?.state.set(state); });

		return _;
	},
);
