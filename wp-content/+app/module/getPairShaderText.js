import { getPairText } from './getPairText.js';

export async function getPairShaderText(/** @type {string} */ url) {
	let text = await getPairText(url);
	// `/// #include` -> `#include`
	text = text.replace(/\/+\s*(?=#include)/g, '');

	return text;
}
