import { defineConfig } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // seguro porque cada teste cria e apaga os próprios dados
  forbidOnly: CI,      // um test.only esquecido não pode passar no pipeline
  // 1 retry no CI: um teste que só passa na segunda tentativa aparece como "flaky"
  // no relatório, em vez de ser escondido
  retries: CI ? 1 : 0,
  reporter: CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: API_URL,
    extraHTTPHeaders: { Accept: 'application/json' },
  },
  // Sobe a ServeRest local automaticamente, a menos que API_URL aponte para outro ambiente
  webServer: process.env.API_URL
    ? undefined
    : {
        command: 'npm run api',
        url: `${API_URL}/usuarios`,
        reuseExistingServer: !CI,
      },
});
