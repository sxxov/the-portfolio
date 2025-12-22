import { crash } from './crash.js';
import { behavior } from '/+std/behavioral/behavior.js';
import { bin } from '/+std/signal/Signal.js';

export const SelfDestructTriggerBehavior = behavior(
	'self-destruct-trigger',
	class {},
	(element, {}, {}) => {
		const _ = bin();

		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		element.addEventListener('click', crash, { signal });

		return _;
	},
);
