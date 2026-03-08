import globals from 'globals';

export default [
    {
        files: ['index.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                // CDN libraries
                gsap: 'readonly',
                gtag: 'readonly',
            },
        },
        rules: {
            'no-console': 'error',
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-var': 'error',
            'prefer-const': 'warn',
        },
    },
];
