export function getPairUrl(/** @type {string} */ url) {
	return `${new URL(url.slice(0, -'.js'.length))}`;
}
