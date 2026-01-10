/* eslint-disable @typescript-eslint/unbound-method */
import { plugin } from '../lib/plugin.js';

const tailwindPluginX = plugin(({ matchVariant, matchUtilities }) => {
	matchVariant('x', (value) => [`:merge(${value})`]);
	matchUtilities({
		x(value) {
			/** @type {string[]} */
			const classNames = [];
			const push = (
				/** @type {number} */ start,
				/** @type {number} */ end,
			) => {
				if (start >= end) return;

				const candidate = value
					.slice(start, end)
					.trim()
					.replace(/\s+/g, '_');
				if (!candidate) return;

				classNames.push(candidate);
			};

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

						if (level <= 0) break;
						push(pointer, i + 1);
						pointer = i + 1;

						break;
					case ',':
						if (level > 0) break;
						push(pointer, i);
						pointer = i + 1;

						break;
					default:
				}
			}
			push(pointer, value.length);

			return { [`@apply ${classNames.join(' ')}`]: {} };
		},
	});
});

export default tailwindPluginX;
