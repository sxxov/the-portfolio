/* eslint-disable @typescript-eslint/unbound-method */
import { plugin } from '../lib/plugin.js';

const tailwindPluginX = plugin(({ matchVariant, matchUtilities }) => {
	matchVariant('x', (value) => [`:merge(${value})`]);
	matchUtilities({
		x(value) {
			const classNames = [];
			let pointer = 0;
			let level = 0;
			for (let i = 0; i < value.length; i++) {
				const char = value.charAt(i);

				switch (char) {
					case '[':
						level++;
						break;
					case ']':
						level--;
						break;
					case ',':
						if (level > 0) break;
						classNames.push(value.slice(pointer, i));
						pointer = i + 1;
						break;
					default:
				}
			}
			classNames.push(value.slice(pointer));

			return { [`@apply ${classNames.join(' ')}`]: {} };
		},
	});
});

export default tailwindPluginX;
