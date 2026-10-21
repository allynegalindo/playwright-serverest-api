import { expect } from '@playwright/test';
import { When, Then } from '../fixtures.js';

When('faço login com as credenciais dele', async ({ loginPage, cenario }) => {
  await loginPage.goto();
  await loginPage.login(cenario.usuario);
});

When('faço login com uma senha errada', async ({ loginPage, cenario }) => {
  await loginPage.goto();
  await loginPage.login({ ...cenario.usuario, password: 'senha-errada' });
});

Then('vejo o painel administrativo com as boas-vindas para ele', async ({ page, painelAdminPage, cenario }) => {
  await expect(page).toHaveURL(/\/admin\/home$/);
  await expect(painelAdminPage.boasVindas).toHaveText(`Bem Vindo ${cenario.usuario.nome}`);
});

Then('vejo a vitrine da loja', async ({ page, lojaPage }) => {
  await expect(page).toHaveURL(/\/home$/);
  await expect(lojaPage.titulo).toBeVisible();
});
