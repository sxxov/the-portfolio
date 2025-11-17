/* eslint-disable @typescript-eslint/unbound-method */
import { plugin } from '../lib/plugin.js';
/** @import {PluginAPI} from 'tailwindcss/types/config.js'; */

const tailwindPluginGridAutoFit = plugin(
	({ matchUtilities, theme }) => {
		matchUtilities(
			{
				'grid-cols-auto-fit': (v) => ({
					gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${String(v)}), 1fr))`,
				}),
				'grid-rows-auto-fit': (v) => ({
					gridTemplateRows: `repeat(auto-fit, minmax(min(100%, ${String(v)}), 1fr))`,
				}),
			},
			{
				values: theme('gridAutoFit') ?? {},
			},
		);
	},
	{
		theme: {
			gridAutoFit: (/** @type {PluginAPI} */ { theme }) =>
				theme('maxWidth'),
		},
	},
);

export default tailwindPluginGridAutoFit;
