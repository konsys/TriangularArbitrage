const {
  defineConfig,
} = require('eslint/config');


module.exports = defineConfig([{
  'ignores': ['temp.js', '**/vendor/*.js', './build/*', './node_modules/*'],
  rules: {
    'array-bracket-spacing': ['error', 'never'],
    'indent': ['warn', 2],
    'linebreak-style': ['error', 'unix'],
    'semi': ['error', 'always'],
    'new-cap': 'off',
    'no-console': 'off',
    'no-mixed-spaces-and-tabs': 2,
    'no-use-before-define': [2, 'nofunc'],
    'no-unreachable': ['warn'],
    'no-unused-vars': ['warn'],
    'quotes': [2, 'single', 'avoid-escape'],
    'block-scoped-const': 'off',

    'brace-style': [2, '1tbs', {
      'allowSingleLine': true,
    }],

    'computed-property-spacing': [2, 'never'],
    'keyword-spacing': 2,
    'space-unary-ops': 2,
  },
}]);
