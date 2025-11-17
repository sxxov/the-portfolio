/* eslint-disable @typescript-eslint/unbound-method */
import { plugin } from '../lib/plugin.js';

const tailwindPluginInsetSize = plugin(({ matchUtilities, theme }) => {
	matchUtilities(
		{
			'inset-size': (value) => {
				const unitfulValue = String(
					Number.isNaN(Number(value)) ? `${value}px` : value,
				);

				if (value === '0' || value === '0px')
					return {
						left: '0',
						top: '0',
						width: '100%',
						height: '100%',
					};

				if (value == 'auto')
					return {
						left: 'auto',
						top: 'auto',
						width: 'auto',
						height: 'auto',
					};

				return {
					left: value,
					top: value,
					width: `calc(100% - (${unitfulValue} * 2))`,
					height: `calc(100% - (${unitfulValue} * 2))`,
				};
			},
		},
		{ values: theme('inset') ?? {} },
	);
});

export default tailwindPluginInsetSize;

