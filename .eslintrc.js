module.exports = {
  root: true,
  extends: '@react-native',
  'rules': {
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 0,
    'accessor-pairs': 'error',
    'array-bracket-newline': [
      'error',
      'consistent'
    ],
    'array-bracket-spacing': [
      'error',
      'never'
    ],
    'array-callback-return': 'error',
    'array-element-newline': 'off',
    'arrow-body-style': 'off',
    'arrow-parens': [
      'error',
      'as-needed'
    ],
    'arrow-spacing': [
      'error',
      {
        'after': true,
        'before': true
      }
    ],
    'block-scoped-var': 'error',
    'block-spacing': 'error',
    'brace-style': [
      'error',
      '1tbs'
    ],
    'callback-return': 'error',
    'camelcase': 'off',
    'capitalized-comments': 'off',
    'class-methods-use-this': 'off',
    'comma-dangle': 'off',
    'comma-spacing': [
      'error',
      {
        'after': true,
        'before': false
      }
    ],
    'comma-style': [
      'error',
      'last'
    ],
    'complexity': 'off',
    'computed-property-spacing': [
      'error',
      'never'
    ],
    'consistent-return': 'off',
    'consistent-this': 'error',
    'curly': 'error',
    'default-case': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'dot-location': [
      'error',
      'property'
    ],
    'dot-notation': 'error',
    'eol-last': 'off',
    'eqeqeq': 'error',
    'func-call-spacing': 'error',
    'func-name-matching': 'error',
    'func-names': 'error',
    'func-style': 'off',
    'function-call-argument-newline': [
      'error',
      'consistent'
    ],
    'function-paren-newline': 'error',
    'generator-star-spacing': 'error',
    'global-require': 'error',
    'grouped-accessor-pairs': 'error',
    'guard-for-in': 'off',
    'handle-callback-err': 'error',
    'id-blacklist': 'error',
    'id-denylist': 'error',
    'id-length': 'off',
    'id-match': 'error',
    'implicit-arrow-linebreak': [
      'error',
      'beside'
    ],
    'indent': 'off',
    'indent-legacy': 'off',
    'init-declarations': 'off',
    'jsx-quotes': [
      'error',
      'prefer-single'
    ],
    'key-spacing': 'off',
    'keyword-spacing': [
      'error',
      {
        'after': true,
        'before': true
      }
    ],
    'line-comment-position': 0,
    'linebreak-style': 'off',
    'lines-around-comment': 'error',
    'lines-around-directive': 'error',
    'lines-between-class-members': 'error',
    'max-classes-per-file': 'error',
    'max-depth': 'error',
    'max-len': 'off',
    'max-lines': 'off',
    'max-lines-per-function': 'off',
    'max-nested-callbacks': 'error',
    'max-params': 'error',
    'max-statements': 'off',
    'max-statements-per-line': 'off',
    'multiline-comment-style': [
      'error',
      'separate-lines'
    ],
    'new-cap': 'off',
    'new-parens': 'error',
    'newline-after-var': 'off',
    'newline-before-return': 'off',
    'newline-per-chained-call': 'off',
    'no-alert': 'error',
    'no-array-constructor': 'error',
    'no-await-in-loop': 'warn',
    'no-bitwise': 'off',
    'no-buffer-constructor': 'error',
    'no-caller': 'error',
    'no-catch-shadow': 'error',
    'no-confusing-arrow': 'error',
    'no-console': 'off',
    'no-constructor-return': 'error',
    'no-continue': 'error',
    'no-div-regex': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'error',
    'no-empty-function': [
      'error',
      {
        'allow': [
          'arrowFunctions',
          'functions'
        ]
      }
    ],
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-extra-parens': 'off',
    'no-floating-decimal': 'error',
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-inline-comments': 0,
    'no-invalid-this': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-loop-func': 'error',
    'no-loss-of-precision': 'error',
    'no-mixed-operators': 'error',
    'no-mixed-requires': 'error',
    'no-multi-assign': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-multiple-empty-lines': 'error',
    'no-native-reassign': 'error',
    'react/display-name': 0,
    'no-negated-in-lhs': 'error',
    'no-nested-ternary': 'off',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-object': 'error',
    'no-new-require': 'error',
    'no-new-wrappers': 'error',
    'no-nonoctal-decimal-escape': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 0,
    'no-path-concat': 'error',
    'no-plusplus': 'off',
    'no-process-env': 'off',
    'no-process-exit': 'error',
    'no-promise-executor-return': 'off',
    'no-proto': 'error',
    'no-restricted-exports': 'error',
    'no-restricted-globals': 'error',
    'no-restricted-imports': 'error',
    'no-restricted-modules': 'error',
    'no-restricted-properties': 'error',
    'no-restricted-syntax': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'off',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-shadow': 'off',
    'no-spaced-func': 'error',
    'no-sync': 'error',
    'no-tabs': 'off',
    'no-template-curly-in-string': 'error',
    'no-ternary': 'off',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'off',
    'no-undef-init': 'error',
    'no-undefined': 'off',
    'no-underscore-dangle': 'off',
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': 'off',
    'no-unreachable-loop': 'error',
    'no-unsafe-optional-chaining': 0,
    'no-unused-expressions': 0,
    'no-use-before-define': 'off',
    'no-useless-backreference': 'error',
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'off',
    'no-void': 'error',
    'no-warning-comments': 'error',
    'no-whitespace-before-property': 'error',
    'nonblock-statement-body-position': 'error',
    'object-curly-newline': 'error',
    'object-curly-spacing': [
      'error',
      'always'
    ],
    'react/prop-types': 0,
    'react/no-children-prop': 0,
    'react/no-unknown-property': 0,
    'object-shorthand': 'off',
    'one-var': 'off',
    'one-var-declaration-per-line': [
      'error',
      'initializations'
    ],
    'operator-assignment': 'error',
    'operator-linebreak': 'error',
    'padded-blocks': 'off',
    'padding-line-between-statements': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-const': 'error',
    'prefer-destructuring': 'error',
    'prefer-exponentiation-operator': 'error',
    'prefer-named-capture-group': 'error',
    'prefer-numeric-literals': 'error',
    'prefer-object-spread': 'error',
    'prefer-promise-reject-errors': 'error',
    'prefer-reflect': 'off',
    'prefer-regex-literals': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'off',
    'quote-props': 'off',
    'quotes': [
      'error',
      'single'
    ],
    'radix': 'error',
    'require-atomic-updates': 'error',
    'require-await': 'error',
    'require-jsdoc': 'off',
    'require-unicode-regexp': 'off',
    'rest-spread-spacing': [
      'error',
      'never'
    ],
    'semi': [
      'error',
      'never'
    ],
    'semi-spacing': 'error',
    'semi-style': [
      'error',
      'last'
    ],
    'sort-keys': 'off',
    'sort-vars': 'off',
    'space-before-blocks': 'error',
    'space-before-function-paren': 'off',
    'space-in-parens': [
      'error',
      'never'
    ],
    'space-infix-ops': [
      'error',
      {
        'int32Hint': false
      }
    ],
    'space-unary-ops': 'error',
    'spaced-comment': [
      'error',
      'always'
    ],
    'strict': 'error',
    'switch-colon-spacing': 'error',
    'symbol-description': 'error',
    'template-curly-spacing': [
      'error',
      'never'
    ],
    'template-tag-spacing': 'error',
    'unicode-bom': [
      'error',
      'never'
    ],
    'valid-jsdoc': 'error',
    'vars-on-top': 'error',
    'wrap-iife': 'error',
    'wrap-regex': 'error',
    'yield-star-spacing': 'error',
    'yoda': [
      'error',
      'never'
    ],
    'no-empty': [
      'error',
      {
        'allowEmptyCatch': true
      }
    ],
    'react/no-unstable-nested-components': 'off',
    'react-native/no-inline-styles': 'off'
  }
}
