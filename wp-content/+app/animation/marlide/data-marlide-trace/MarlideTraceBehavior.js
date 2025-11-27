import { MarlideTraceCharacterBehavior } from './MarlideTraceCharacterBehavior.js';
import { MarlideTraceWhitespaceBehavior } from './MarlideTraceWhitespaceBehavior copy.js';
import { MarlideTraceWordBehavior } from './MarlideTraceWordBehavior.js';
import { attachBehavior, behavior, t } from '/+std/behavioral/behavior.js';
import { watchElementIntersecting } from '/+std/dom/watchElementIntersecting.js';
import { bin, Signal, subscribe } from '/+std/signal/Signal.js';
import { unwrap } from '/+std/type/utilities/unwrap.js';
import { isInEditor } from '/+std/wordpress/isInEditor.js';

export const MarlideTraceBehavior = behavior(
	'marlide-trace',
	class {
		perStagger = t.number.styling.default(100);
		perDuration = t.number.styling.default(1000);
		debounce = t.number.styling.default(1000);
		tracking = t.number.styling;
		leading = t.number.styling;
		obscured = t.boolean.transient.attributing;
	},
	(element, { obscured, debounce }, { registerLocalBehaviors }) => {
		if (isInEditor()) return;

		registerLocalBehaviors(
			MarlideTraceCharacterBehavior,
			MarlideTraceWhitespaceBehavior,
			MarlideTraceWordBehavior,
		);

		const _ = bin();
		const { innerText: initialInnerText } = element;
		const initialChildren = [...element.childNodes];

		const intersecting = watchElementIntersecting(element);
		const revealed = new Signal(!obscured.get(), ({ set }) =>
			subscribe(
				{ intersecting, debounce },
				({ $intersecting, $debounce }) => {
					if ($intersecting) {
						set(true);
					} else {
						const handle = setTimeout(() => {
							set(false);
						}, $debounce);

						return () => {
							clearTimeout(handle);
						};
					}
				},
			),
		);
		obscured.in(revealed.derive((v) => !v));
		const spans = (() => {
			const wordStack = /** @type {HTMLElement[]} */ ([]);
			const charStack = /** @type {HTMLElement[]} */ ([]);

			for (let i = 0; i < initialInnerText.length; i++) {
				const char = unwrap(initialInnerText[i]);

				const isWhitespace = /^\s+$/.test(char);
				if (isWhitespace) {
					const wordElement = document.createElement('span');
					wordElement.replaceChildren(...charStack);
					attachBehavior(wordElement, MarlideTraceWordBehavior, {});
					wordStack.push(wordElement);

					const whitespaceElement = document.createElement('span');
					whitespaceElement.replaceChildren(char);
					attachBehavior(
						whitespaceElement,
						MarlideTraceWhitespaceBehavior,
						{},
					);
					wordStack.push(whitespaceElement);

					charStack.length = 0;
					continue;
				}

				const charElement = document.createElement('span');
				charElement.replaceChildren(char);
				attachBehavior(charElement, MarlideTraceCharacterBehavior, {
					'': char,
					index: i,
				});
				charStack.push(charElement);
			}
			const hasRemaining = charStack.length > 0;
			if (hasRemaining) {
				const wordElement = document.createElement('span');
				wordElement.replaceChildren(...charStack);
				attachBehavior(wordElement, MarlideTraceWordBehavior, {});
				wordStack.push(wordElement);
			}

			return wordStack;
		})();

		add: { element.replaceChildren(...spans); }
		remove: _._ = () => { element.replaceChildren(...initialChildren); };

		return _;
	},
);
