export function e(/** @type {string} */ value) {
	return value //
		.replace(/[^\w-]/g, '-')
		.replace(/-+/g, '-');
}
