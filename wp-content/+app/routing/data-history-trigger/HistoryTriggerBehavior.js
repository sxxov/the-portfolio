import { behavior, t } from '/+std/behavioral/behavior.js';
import { setAttributes } from '/+std/dom/setAttributes.js';
import { bin, subscribe } from '/+std/signal/Signal.js';

export const HistoryTriggerBehavior = behavior(
	'history-trigger',
	class {
		'' = t.string.choices('back', 'forward').default('back');
		available = t.boolean.transient.attributing.default(true);
	},
	(element, { '': to, available }, {}) => {
		const _ = bin();
		const controller = new AbortController();
		_._ = () => { controller.abort(); };
		const { signal } = controller;

		element.addEventListener(
			'click',
			(event) => {
				const $to = to.get();

				switch ($to) {
					case 'back':
						event.preventDefault();
						history.back();
						break;
					case 'forward':
						event.preventDefault();
						history.forward();
						break;
					default:
				}
			},
			{ signal },
		);

		_._ = available.subscribeStart(({ set }) =>
			subscribe({ to }, ({ $to }) => {
				const _ = bin();
				const controller = new AbortController();
				_._ = () => { controller.abort(); };
				const { signal } = controller;

				const update = () => {
					set(isAvailable($to));
				};

				update();
				addEventListener('popstate', update, { signal });

				return _;
			}),
		);

		_._ = subscribe({ available }, ({ $available }) => {
			setAttributes(element, { disabled: !$available });
		});

		return _;
	},
);

function isAvailable(/** @type {'back' | 'forward' | (string & {})} */ to) {
	if (
		!('navigation' in window) ||
		!window.navigation ||
		typeof window.navigation !== 'object' ||
		!('canGoBack' in window.navigation) ||
		!('canGoForward' in window.navigation)
	)
		return true;

	switch (to) {
		case 'back':
			return Boolean(window.navigation.canGoBack);
		case 'forward':
			return Boolean(window.navigation.canGoForward);
		default:
			return true;
	}
}
