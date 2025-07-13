import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['dist/**', 'node_modules/**', 'src/database/migrations/**'],
    languageOptions: {
      parser: (await import('@typescript-eslint/parser')).default,
      parserOptions: {
        project: `${__dirname}/tsconfig.eslint.json`,
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': (await import('@typescript-eslint/eslint-plugin')).default,
      prettier: (await import('eslint-plugin-prettier')).default,
    },
    rules: {
      // Prettier
      'prettier/prettier': 'error',

      // TS rules — сделаем конфиг строже
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': 'warn',

      // JS style
      'no-console': 'warn',
      'no-debugger': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },
];