import { getPairUrl } from './getPairUrl.js';

export async function getPairText(/** @type {string} */ url) {
	return (await fetch(getPairUrl(url))).text();
}
