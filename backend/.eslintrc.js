module.exports = {
    env: {
        node: true,
        es2021: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:security/recommended',
        'plugin:node/recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    plugins: [
        'security',
        'node'
    ],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'node/no-unsupported-features/es-syntax': [
            'error',
            { ignores: ['modules'] }
        ],
        'security/detect-object-injection': 'warn',
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-unsafe-regex': 'warn',
        'security/detect-buffer-noassert': 'warn',
        'security/detect-child-process': 'warn',
        'security/detect-disable-mustache-escape': 'warn',
        'security/detect-eval-with-expression': 'warn',
        'security/detect-no-csrf-before-method-override': 'warn',
        'security/detect-non-literal-require': 'warn',
        'security/detect-possible-timing-attacks': 'warn',
        'security/detect-pseudoRandomBytes': 'warn',
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'camelcase': ['error', { 'properties': 'never' }],
        'max-len': ['error', { 'code': 100 }],
        'complexity': ['error', { 'max': 10 }],
        'max-lines-per-function': ['error', { 'max': 50 }],
        'max-params': ['error', { 'max': 3 }],
        'no-var': 'error',
        'prefer-const': 'error',
        'no-multiple-empty-lines': ['error', { 'max': 1 }],
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        'no-multi-spaces': 'error',
        'no-whitespace-before-property': 'error',
        'space-before-blocks': 'error',
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'never',
            'asyncArrow': 'always'
        }],
        'space-in-parens': ['error', 'never'],
        'space-infix-ops': 'error',
        'space-unary-ops': 'error',
        'spaced-comment': ['error', 'always'],
        'arrow-spacing': 'error',
        'block-spacing': 'error',
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'comma-style': ['error', 'last'],
        'computed-property-spacing': ['error', 'never'],
        'func-call-spacing': ['error', 'never'],
        'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
        'keyword-spacing': ['error', { 'before': true, 'after': true }],
        'object-curly-spacing': ['error', 'always'],
        'rest-spread-spacing': ['error', 'never'],
        'semi-spacing': ['error', { 'before': false, 'after': true }],
        'template-curly-spacing': ['error', 'never'],
        'yield-star-spacing': ['error', 'both']
    },
    overrides: [
        {
            files: ['**/__tests__/**/*.js'],
            env: {
                jest: true
            },
            rules: {
                'node/no-unpublished-require': 'off',
                'node/no-missing-require': 'off'
            }
        }
    ]
};
