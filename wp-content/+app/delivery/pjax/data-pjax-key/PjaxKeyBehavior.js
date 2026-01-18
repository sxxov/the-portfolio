import { PjaxBehavior } from '../data-pjax/PjaxBehavior.js';
import { behavior, t } from '/+std/behavioral/behavior.js';
import { bin, subscribe } from '/+std/signal/Signal.js';

export const PjaxKeyBehavior = behavior(
	'pjax-key',
	class {
		'' = t.string;
	},
	(element, { '': name }, { getContext }) =>
		subscribe({ pjax: getContext(PjaxBehavior) }, ({ $pjax }) => {
			if (!$pjax) return;

			const { memoisedElements } = $pjax;
			const _ = bin();

			_._ = subscribe({ name }, ({ $name }) => {
				if (!$name) return;

				let memoisedElement = memoisedElements.get($name);
				if (!memoisedElement) {
					memoisedElements.set($name, element);
					memoisedElement = element;
				}
				if (memoisedElement !== element)
					element.replaceWith(memoisedElement);

				return () => { memoisedElements.delete($name); };
			});

			return _;
		}),
);
