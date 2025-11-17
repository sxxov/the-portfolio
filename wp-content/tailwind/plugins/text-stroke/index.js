/* eslint-disable @typescript-eslint/unbound-method */
import { flattenColorPalette } from '../lib/flattenColorPalette.js';
import { plugin } from '../lib/plugin.js';
/** @import {PluginAPI} from 'tailwindcss/types/config.js' */

const tailwindPluginTextStroke = plugin(
	({ matchUtilities, theme }) => {
		matchUtilities(
			{
				'text-stroke': (/** @type {string} */ value) => ({
					'text-stroke-width': value,
					'-webkit-text-stroke-width': value,
				}),
			},
			{
				values: theme('textStrokeWidth'),
			},
		);
		const colors = flattenColorPalette(theme('colors'));
		matchUtilities(
			{
				'text-stroke'(getterOrValue) {
					const value =
						typeof getterOrValue === 'function' ?
							getterOrValue({})
						:	getterOrValue;
					return {
						'text-stroke-color': value,
						'-webkit-text-stroke-color': value,
					};
				},
			},
			{
				values: colors,
				type: ['color'],
			},
		);
		matchUtilities(
			{
				'text-fill'(getterOrValue) {
					const value =
						typeof getterOrValue === 'function' ?
							getterOrValue({})
						:	getterOrValue;
					return {
						'text-fill-color': value,
						'-webkit-text-fill-color': value,
					};
				},
			},
			{
				values: colors,
				type: ['color'],
			},
		);
	},
	{
		theme: {
			textStrokeWidth: (/** @type {PluginAPI} */ { theme }) => ({
				...theme('borderWidth'),
			}),
		},
	},
);

export default tailwindPluginTextStroke;
