/* eslint-disable @typescript-eslint/unbound-method */
import { plugin } from '../lib/plugin.js';

const gridColCount = 9;
const gridRowCount = 9;
const gridAreaThemeEntries = Array.from({ length: gridColCount }, (_, col) =>
	Array.from(
		{ length: gridRowCount },
		(_, row) =>
			/** @type {const} */ ([
				`${col + 1}x${row + 1}`,
				`${col + 1}/${row + 1}`,
			]),
	),
).flat();
const gridAreasThemeEntries = Array.from({ length: gridColCount }, (_, col) =>
	Array.from(
		{ length: gridRowCount },
		(_, row) =>
			/** @type {const} */ ([
				`${col + 1}x${row + 1}`,
				`repeat(${row + 1}, var(--grid-areas-row)) / repeat(${col + 1}, var(--grid-areas-col))`,
			]),
	),
).flat();

const tailwindPluginGridAutoFit = plugin(
	({ matchUtilities, addBase, theme }) => {
		addBase({
			':where([class*="grid-area-"])': {
				'--grid-area-col-start-list': `min(${Array.from(
					{ length: gridColCount },
					(_, i) => i,
				)
					.map((i) => `var(--grid-area-col-start-${i + 1})`)
					.join(', ')})`,
				'--grid-area-col-end-list': `max(${Array.from(
					{ length: gridColCount },
					(_, i) => i,
				)
					.map((i) => `var(--grid-area-col-end-${i + 1})`)
					.join(', ')})`,
				'--grid-area-row-start-list': `min(${Array.from(
					{ length: gridRowCount },
					(_, i) => i,
				)
					.map((i) => `var(--grid-area-row-start-${i + 1})`)
					.join(', ')})`,
				'--grid-area-row-end-list': `max(${Array.from(
					{ length: gridRowCount },
					(_, i) => i,
				)
					.map((i) => `var(--grid-area-row-end-${i + 1})`)
					.join(', ')})`,
				...Object.fromEntries(
					Array.from(
						{ length: gridColCount },
						(_, i) =>
							/** @type {const} */ ([
								[
									`--grid-area-col-start-${i + 1}`,
									`${gridColCount + 1}`,
								],
								[`--grid-area-col-end-${i + 1}`, '0'],
							]),
					).flat(),
				),
				...Object.fromEntries(
					Array.from(
						{ length: gridRowCount },
						(_, i) =>
							/** @type {const} */ ([
								[
									`--grid-area-row-start-${i + 1}`,
									`${gridRowCount + 1}`,
								],
								[`--grid-area-row-end-${i + 1}`, '0'],
							]),
					).flat(),
				),
			},
		});
		matchUtilities(
			{
				'grid-area'(v) {
					const [col, row] = v.split(/\s*\/\s*/);
					if (col === undefined || row === undefined) return {};

					return {
						[`--grid-area-col-start-${col}`]: col,
						[`--grid-area-col-end-${col}`]: col,
						[`--grid-area-row-start-${row}`]: row,
						[`--grid-area-row-end-${row}`]: row,
						gridArea: `var(--grid-area-row-start-list) / var(--grid-area-col-start-list) / calc(var(--grid-area-row-end-list) + 1) / calc(var(--grid-area-col-end-list) + 1)`,
					};
				},
			},
			{
				values: theme('gridArea') ?? {},
			},
		);
		matchUtilities(
			{
				'grid-areas': (v) => ({
					'--grid-areas-col': 'minmax(0, 1fr)',
					'--grid-areas-row': 'minmax(0, 1fr)',
					gridTemplate: v,
				}),
			},
			{
				values: theme('gridAreas') ?? {},
			},
		);
		matchUtilities(
			{
				'grid-areas-col': (v) => ({
					'--grid-areas-col': v,
				}),
			},
			{
				values: theme('gridAreasColumn') ?? {},
			},
		);
		matchUtilities(
			{
				'grid-areas-row': (v) => ({
					'--grid-areas-row': v,
				}),
			},
			{
				values: theme('gridAreasRow') ?? {},
			},
		);
	},
	{
		theme: {
			gridArea: Object.fromEntries(gridAreaThemeEntries),
			gridAreas: Object.fromEntries(gridAreasThemeEntries),
			gridAreasColumn: {
				'1fr': 'minmax(0, 1fr)',
				auto: 'minmax(0, auto)',
			},
			gridAreasRow: {
				'1fr': 'minmax(0, 1fr)',
				auto: 'minmax(0, auto)',
			},
		},
	},
);

export default tailwindPluginGridAutoFit;
