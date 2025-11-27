import { behavior, t } from '/+std/behavioral/behavior.js';
import { bin, subscribe } from '/+std/signal/Signal.js';

export const MarlideTraceCharacterBehavior = behavior(
	'marlide-trace-character',
	class {
		'' = t.string;
		index = t.number.transient.styling;
	},
	(element, { '': character }) => {
		const _ = bin();

		_._ = subscribe({ character }, ({ $character }) => {
			if (!$character) return;

			const wrapperElement = document.createElement('span');
			wrapperElement.replaceChildren($character);

			element.replaceChildren(wrapperElement);
			return () => { element.replaceChildren(); };
		});

		return _;
	},
);
