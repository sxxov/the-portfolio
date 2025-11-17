/** @import {default as twPlugin} from 'tailwindcss/plugin.js' */
/** @import {Config, PluginAPI} from 'tailwindcss/types/config.js' */

/** @returns {ReturnType<typeof twPlugin>} */
export function plugin(
	/** @type {Parameters<typeof twPlugin>[0]} */ plugin,
	/** @type {Parameters<typeof twPlugin>[1]} */ config,
) {
	return {
		handler: plugin,
		...(config && { config }),
	};
}
