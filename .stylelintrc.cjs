module.exports = {
	indent: 'tab',
	extends: 'stylelint-config-standard',
	defaultSeverity: 'warning',
	plugins: ['@stylistic/stylelint-plugin'],
	rules: {
		'@stylistic/string-quotes': 'single',
		'@stylistic/indentation': null,
		'comment-empty-line-before': [
			'always',
			{ ignore: ['after-comment'], except: ['first-nested'] },
		],
		'declaration-empty-line-before': [
			'always',
			{ ignore: ['after-declaration', 'first-nested'] },
		],
		'at-rule-no-unknown': null,
		'function-no-unknown': [
			true,
			{
				ignoreFunctions: ['theme'],
			},
		],
		'value-keyword-case': null,
		'unit-no-unknown': null,
		'import-notation': 'string',
		'custom-property-empty-line-before': null,
		'hue-degree-notation': 'number',
		'selector-class-pattern': null,
	},
};
