/* eslint-disable @typescript-eslint/unbound-method */
import { flattenColorPalette } from '../lib/flattenColorPalette.js';
import { plugin } from '../lib/plugin.js';
/** @import {PluginAPI, KeyValuePair} from 'tailwindcss/types/config.js' */
/** @import {Colors} from '../lib/Colors.js' */
/** @import {GeneratorValue} from './GeneratorValue.js' */

const getCalcForFactor = (
	/** @type {-1 | 0 | 1} */ factor,
	/** @type {string} */ value,
) =>
	factor === -1 ? `calc(${factor} * ${value})`
	: factor === 0 ? '0'
	: value;

const createOctPartsIter = function* (
	/** @type {string} */ width,
	/** @type {string} */ color,
	/** @type {string} */ blur,
) {
	for (let fx = -1; fx <= 1; fx++) {
		for (/** @type {-1 | 0 | 1} */ let fy = -1; fy <= 1; fy++) {
			yield {
				x: getCalcForFactor(/** @type {-1 | 0 | 1} */ (fx), width),
				y: getCalcForFactor(/** @type {-1 | 0 | 1} */ (fy), width),
				color,
				blur,
			};
		}
	}
};

function getOctPartValue(
	/** @type {GeneratorValue<typeof createOctPartsIter>} */ {
		x,
		y,
		color,
		blur,
	},
) {
	return `${x} ${y} ${blur} ${color}`;
}

function getSpreadValue(
	/** @type {string} */ width,
	/** @type {string} */ color,
	/** @type {string} */ blur,
) {
	return `0 0 ${blur} ${width} ${color}`;
}
function getColorValue(
	/** @type {string | ReturnType<typeof flattenColorPalette>[string]} */ getterOrValue,
) {
	return typeof getterOrValue === 'function' ?
			getterOrValue({})
		:	getterOrValue;
}

function getVarValue(
	/** @type {string} */ varName,
	/** @type {string | undefined} */ fallback,
) {
	return `var(${varName}${fallback ? `, ${fallback}` : ''})`;
}

const TEXT_SHADOW_WIDTH_VAR_NAME = `--outset-text-shadow-width`;
const TEXT_SHADOW_COLOR_VAR_NAME = `--outset-text-shadow-color`;
const TEXT_SHADOW_BLUR_VAR_NAME = `--outset-text-shadow-blur`;
const TEXT_SHADOW_VALUE = [
	...createOctPartsIter(
		getVarValue(TEXT_SHADOW_WIDTH_VAR_NAME),
		getVarValue(TEXT_SHADOW_COLOR_VAR_NAME, 'currentColor'),
		getVarValue(TEXT_SHADOW_BLUR_VAR_NAME, '0'),
	),
]
	.map(getOctPartValue)
	.join(', ');

const DROP_SHADOW_WIDTH_VAR_NAME = `--outset-drop-shadow-width`;
const DROP_SHADOW_COLOR_VAR_NAME = `--outset-drop-shadow-color`;
const DROP_SHADOW_BLUR_VAR_NAME = `--outset-drop-shadow-blur`;
const DROP_SHADOW_VALUE =
	[
		...createOctPartsIter(
			getVarValue(DROP_SHADOW_WIDTH_VAR_NAME),
			getVarValue(DROP_SHADOW_COLOR_VAR_NAME, 'currentColor'),
			getVarValue(DROP_SHADOW_BLUR_VAR_NAME, '0'),
		),
	]
		.map(getOctPartValue)
		.map((value) => `drop-shadow(${value})`)
		.join(' ') +
	' var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)';

const BOX_SHADOW_WIDTH_VAR_NAME = `--outset-box-shadow-width`;
const BOX_SHADOW_COLOR_VAR_NAME = `--outset-box-shadow-color`;
const BOX_SHADOW_BLUR_VAR_NAME = `--outset-box-shadow-blur`;
const BOX_SHADOW_VALUE = getSpreadValue(
	getVarValue(BOX_SHADOW_WIDTH_VAR_NAME),
	getVarValue(BOX_SHADOW_COLOR_VAR_NAME, 'currentColor'),
	getVarValue(BOX_SHADOW_BLUR_VAR_NAME, '0'),
);

const tailwindPluginOutset = plugin(
	({ matchUtilities, theme }) => {
		const colors = flattenColorPalette(theme('colors'));
		for (const [
			name,
			prop,
			propValue,
			widthVar,
			colorVar,
			blurVar,
		] of /** @type {const} */ ([
			[
				'text',
				'text-shadow',
				TEXT_SHADOW_VALUE,
				TEXT_SHADOW_WIDTH_VAR_NAME,
				TEXT_SHADOW_COLOR_VAR_NAME,
				TEXT_SHADOW_BLUR_VAR_NAME,
			],
			[
				'drop',
				'filter',
				DROP_SHADOW_VALUE,
				DROP_SHADOW_WIDTH_VAR_NAME,
				DROP_SHADOW_COLOR_VAR_NAME,
				DROP_SHADOW_BLUR_VAR_NAME,
			],
			[
				'box', //
				'box-shadow',
				BOX_SHADOW_VALUE,
				BOX_SHADOW_WIDTH_VAR_NAME,
				BOX_SHADOW_COLOR_VAR_NAME,
				BOX_SHADOW_BLUR_VAR_NAME,
			],
		])) {
			matchUtilities(
				{
					[`${name}-outset`]: (/** @type {string} */ value) => ({
						[widthVar]: value,
						[prop]: propValue,
					}),
				},
				{
					values: theme('outsetWidth'),
				},
			);
			matchUtilities(
				{
					[`${name}-outset`](color) {
						const value = getColorValue(color);
						return {
							[colorVar]: value,
							[prop]: propValue,
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
					[`${name}-outset-blur`](blur) {
						return {
							[blurVar]: getColorValue(blur),
							[prop]: propValue,
						};
					},
				},
				{
					values: /** @type {any} */ (theme('spacing')),
					type: ['length'],
				},
			);
		}
	},
	{
		theme: {
			outsetWidth: (/** @type {PluginAPI} */ { theme }) => ({
				...theme('borderWidth'),
			}),
		},
	},
);

export default tailwindPluginOutset;
