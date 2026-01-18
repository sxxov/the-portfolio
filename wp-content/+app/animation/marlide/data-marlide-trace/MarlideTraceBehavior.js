import { MarlideTraceCharacterBehavior } from './MarlideTraceCharacterBehavior.js';
import { MarlideTraceWhitespaceBehavior } from './MarlideTraceWhitespaceBehavior.js';
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
		const spans = transformChildrenToWordSpans(element.childNodes);

		add: { element.replaceChildren(...spans); }
		remove: _._ = () => { element.replaceChildren(...initialChildren); };

		return _;
	},
);

/** @typedef {{ index: number }} WordContext */

function transformChildrenToWordSpans(
	/** @type {NodeList} */ nodes,
	/** @type {WordContext} */ context = { index: 0 },
) {
	return [...nodes].flatMap((node) => {
		if (node instanceof HTMLElement) {
			const clone = /** @type {typeof node} */ (node.cloneNode());
			clone.replaceChildren(
				...transformChildrenToWordSpans(node.childNodes, context),
			);
			return clone;
		}

		if (node instanceof Text) {
			return getWordSpansByText(node.data, context);
		}

		return [];
	});
}

function getWordSpansByText(
	/** @type {string} */ text,
	/** @type {WordContext} */ context,
) {
	const wordStack = /** @type {HTMLElement[]} */ ([]);
	const charStack = /** @type {HTMLElement[]} */ ([]);

	for (let i = 0; i < text.length; i++, context.index++) {
		const char = unwrap(text[i]);

		const isWhitespace = /^\s$/.test(char);
		if (isWhitespace) {
			// TODO: this doesn't really feel right, but gives the best result
			// we discard any whitespace that isn't preceded with a word,
			// instead of "stacking" these hanging whitespaces
			if (charStack.length <= 0) continue;

			const wordElement = (() => {
				const it = document.createElement('span');
				it.replaceChildren(...charStack);
				attachBehavior(it, MarlideTraceWordBehavior, {});
				return it;
			})();
			wordStack.push(wordElement);

			const whitespaceElement = (() => {
				switch (char) {
					case '\n': {
						const it = document.createElement('br');
						return it;
					}

					default: {
						const it = document.createElement('span');
						it.replaceChildren(char);
						attachBehavior(it, MarlideTraceWhitespaceBehavior, {});
						return it;
					}
				}
			})();
			wordStack.push(whitespaceElement);

			charStack.length = 0;
			continue;
		}

		const charElement = (() => {
			const it = document.createElement('span');
			it.replaceChildren(char);
			attachBehavior(it, MarlideTraceCharacterBehavior, {
				'': char,
				index: context.index,
			});
			return it;
		})();
		charStack.push(charElement);
	}
	const hasRemaining = charStack.length > 0;
	if (hasRemaining) {
		const wordElement = (() => {
			const it = document.createElement('span');
			it.replaceChildren(...charStack);
			attachBehavior(it, MarlideTraceWordBehavior, {});
			return it;
		})();
		wordStack.push(wordElement);
	}

	return wordStack;
}
