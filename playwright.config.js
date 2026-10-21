import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';

const CI = !!process.env.CI;

// API local, iniciada pelo webServer abaixo, para os testes de API
const API_URL = process.env.API_URL ?? 'http://localhost:3000';
// O front público só conversa com a API pública, então o E2E cria os dados lá
const FRONT_URL = process.env.FRONT_URL ?? 'https://front.serverest.dev';
const FRONT_API_URL = process.env.FRONT_API_URL ?? 'https://serverest.dev';

// Gera os testes do Playwright a partir dos arquivos .feature (comando "bddgen")
const e2eTestDir = defineBddConfig({
  features: 'tests/e2e/features/*.feature',
  steps: ['tests/e2e/steps/*.js', 'tests/e2e/fixtures.js'],
  outputDir: '.features-gen',
  language: 'pt',
});

export default defineConfig({
  fullyParallel: true, // seguro porque cada teste cria e apaga os próprios dados
  forbidOnly: CI,      // um test.only esquecido não pode passar no pipeline
  // 1 retry no CI: um teste que só passa na segunda tentativa aparece como "flaky"
  // no relatório, em vez de ser escondido
  retries: CI ? 1 : 0,
  reporter: CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { apiURL: API_URL },
    },
    {
      name: 'e2e',
      testDir: e2eTestDir,
      // No ambiente público, o cadastro leva de 4 a 5,5s até redirecionar (medido): o
      // front baixa a lista inteira de usuários. Os 5s padrão ficavam no limite
      expect: { timeout: 10_000 },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: FRONT_URL,
        apiURL: FRONT_API_URL,
        // Evidências para investigar falhas: trace com rede, DOM e console de cada passo
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
      },
    },
  ],
  // Sobe a ServeRest local automaticamente, a menos que API_URL aponte para outro ambiente
  webServer: process.env.API_URL
    ? undefined
    : {
        command: 'npm run api',
        url: `${API_URL}/usuarios`,
        reuseExistingServer: !CI,
      },
});
