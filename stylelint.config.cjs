module.exports = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-recommended-vue'
  ],
  overrides: [
    {
      files: ['*.vue', '**/*.vue'],
      customSyntax: 'postcss-html'
    }
  ],
  rules: {
    'no-descending-specificity': null,
    'at-rule-no-deprecated': null,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'tailwind',
          'apply',
          'variants',
          'responsive',
          'screen',
          'layer',
          'config',
          'utility',
          'reference'
        ]
      }
    ],
    'no-invalid-position-at-import-rule': null,
    'import-notation': null,
    'value-keyword-case': null,
    'function-no-unknown': [
      true,
      {
        ignoreFunctions: ['theme']
      }
    ],
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['content-visibility']
      }
    ]
  }
}
