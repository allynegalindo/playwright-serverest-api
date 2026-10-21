import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default [
  { ignores: ['playwright-report/', 'test-results/'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { ...playwright.configs['flat/recommended'], files: ['tests/**'] },
];
