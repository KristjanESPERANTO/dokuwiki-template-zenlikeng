import js from '@eslint/js';
import css from '@eslint/css';

export default [
  {
    ...js.configs.recommended,
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        document: 'readonly',
      },
    },
  },
  {
    ...css.configs.recommended,
    files: ['css/**/*.css'],
    language: 'css/css',
    rules: {
      'css/no-empty-blocks': 'off',
      'css/no-invalid-properties': 'off',
      'css/no-important': 'off',
    },
  },
];