import { behavior } from '/+std/behavioral/behavior.js';
import { setStyles } from '/+std/dom/setStyles.js';
import { bin } from '/+std/signal/Signal.js';
import { isInEditor } from '/+std/wordpress/isInEditor.js';
import { PerSplitMode } from '/+theme/animation/text/lib/PerSplitMode.js';
import { transformTextContentIntoPerSpans } from '/+theme/animation/text/lib/transformTextContentIntoPerSpans.js';

export const TextShiftAlternateBehavior = behavior(
	'text-shift-alternate',
	class {},
	(element, {}, {}) => {
		if (isInEditor()) return;

		const _ = bin();

		const children = [...element.childNodes];
		_._ = () => { element.replaceChildren(...children); };

		const { spans } = transformTextContentIntoPerSpans(
			element,
			PerSplitMode.Character,
		);
		for (const [i, span] of spans.entries())
			setStyles(span, {
				'--per-alternate-direction': `${(i % 2) * 2 - 1}`,
			});

		return _;
	},
);
