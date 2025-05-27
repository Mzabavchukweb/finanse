module.exports = {
    env: {
        browser: true,
        commonjs: true,
        es2021: true,
        node: true,
        jest: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    ignorePatterns: [
        'node_modules/',
        'coverage/',
        'frontend/',
        'backend-clean/',
        '*.min.js',
        'dist/',
        'build/',
        'migrations/',
        'scripts/',
        'controllers/',
        'middleware/',
        'routes/',
        'utils/',
        'validators/',
        '__tests__/',
        '*.test.js'
    ],
    rules: {
        'indent': ['error', 4],
        'linebreak-style': ['error', 'unix'],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'max-len': ['error', { 'code': 120 }],
        'no-trailing-spaces': 'error',
        'eol-last': 'error',
        'max-lines-per-function': 'off'
    }
}; 