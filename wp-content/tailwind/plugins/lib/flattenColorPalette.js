/** @import {KeyValuePair} from 'tailwindcss/types/config.js' */
/** @import {Colors} from './Colors.js' */

/**
 * This whole function is fucked. It's a lie. Idk why, but tailwind thinks the
 * function signature is a key value pair of string & function, when it should
 * be string & string. this function just, does the things & fakes its signature
 * too, to fit into tailwind's api.
 */
export function flattenColorPalette(/** @type {Colors} */ colors) {
	/**
	 * @type {KeyValuePair<
	 * 	string,
	 * 	string | ((o: { opacityValue?: number }) => string)
	 * >}
	 */ const result = {};

	for (const [root, children] of Object.entries(colors)) {
		if (typeof children === 'object') {
			for (const [parent, value] of Object.entries(
				flattenColorPalette(children),
			)) {
				result[`${root}${parent === 'DEFAULT' ? '' : `-${parent}`}`] =
					value;
			}
		} else {
			result[root] = children;
		}
	}

	return result;
}
