import { getPairText } from './getPairText.js';

/**
 * Wraps {@linkcode getPairText} but removes workaround syntaxes used for
 * intellisense in shaders
 *
 * - `/// #include` -> `#include`
 * - Removes `#ifdef _` blocks
 */
export async function getPairShaderText(/** @type {string} */ url) {
	let text = await getPairText(url);

	// `/// #include` -> `#include`
	text = text.replace(/\/+\s*(?=#include)/g, '');

	// remove `#ifdef _` & `#endif`
	text = text.replace(/#ifdef\s+_.*?#endif\s*/gs, '');

	return text;
}
