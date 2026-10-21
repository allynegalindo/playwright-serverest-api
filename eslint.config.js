import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import globals from 'globals';

export default [
  { ignores: ['playwright-report/', 'test-results/', '.features-gen/'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { ...playwright.configs['flat/recommended'], files: ['tests/**'] },
  {
    // Os steps rodam dentro dos testes que o playwright-bdd gera a partir das features
    files: ['tests/e2e/steps/**'],
    rules: { 'playwright/no-standalone-expect': 'off' },
  },
];
