import '@theatre/core';
import studio from '@theatre/studio';
import {
	behavior,
	registerGlobalBehaviors,
} from '/+std/behavioral/behavior.js';
import { bin } from '/+std/signal/Signal.js';

studio.initialize();

export const TheatreStudioBehavior = behavior(
	'theatre-studio',
	class {},
	(element) => {
		const _ = bin();

		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		element.addEventListener(
			'keydown',
			(event) => {
				if (event.ctrlKey || event.metaKey || event.altKey) return;
				if (event.key === 'Enter') return;

				event.stopPropagation();
			},
			{ signal, capture: true },
		);

		return _;
	},
);

registerGlobalBehaviors(TheatreStudioBehavior);
