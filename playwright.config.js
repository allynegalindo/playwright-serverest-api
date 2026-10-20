import { defineConfig } from '@playwright/test';

const API_URL = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true, // seguro porque cada teste cria e apaga os próprios dados
  reporter: [['list'], ['html', { open: 'never' }]],
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
        reuseExistingServer: !process.env.CI,
      },
});
