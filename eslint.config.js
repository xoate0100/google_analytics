import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      complexity: ['warn', { max: 10 }],
      'max-lines-per-function': ['warn', { max: 50 }],
      'max-params': ['warn', { max: 5 }],
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'build/',
      'coverage/',
      '*.config.ts',
      '*.config.js',
      'test/fixtures/',
      '.vscode/',
      '.idea/',
    ],
  },
  {
    files: ['test/**/*', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'max-lines-per-function': ['warn', { max: 300 }],
    },
  },
  {
    files: ['scripts/**/*'],
    rules: {
      'no-console': 'off',
      'max-lines-per-function': ['warn', { max: 100 }],
      complexity: ['warn', { max: 15 }],
    },
  }
);

