/* eslint-disable @typescript-eslint/unbound-method */
import { plugin } from '../lib/plugin.js';
/** @import {Config} from 'tailwindcss' */

/* stolen from https://github.com/soorria/tailwindcss-hocus/blob/main/src/index.js */

/**
 * Adapted from
 * https://github.com/tailwindlabs/tailwindcss/blob/master/src/featureFlags.js
 */
function futureFlagEnabled(
	/** @type {Config} */ config,
	/** @type {string} */ flag,
) {
	return Boolean(
		config.future === 'all' ||
			config.future?.[/** @type {keyof typeof config.future} */ (flag)],
	);
}

const tailwindPluginHocus = plugin(({ addVariant, config }) => {
	const hoverOnlyWhenSupported = futureFlagEnabled(
		config(),
		'hoverOnlyWhenSupported',
	);
	const wrapSelectorForHoverIfNeeded = (/** @type {string} */ selector) =>
		hoverOnlyWhenSupported ?
			`@media (hover: hover) and (pointer: fine) { ${selector} }`
		:	selector;

	const hoverSelector = wrapSelectorForHoverIfNeeded('&:hover');

	addVariant('hocus', [hoverSelector, '&:focus']);
	addVariant('hocus-within', [hoverSelector, '&:focus-within']);
	addVariant('hocus-visible', [hoverSelector, '&:focus-visible']);
});

export default tailwindPluginHocus;
