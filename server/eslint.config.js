const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      ...tseslint.configs.recommended,
    ],
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
