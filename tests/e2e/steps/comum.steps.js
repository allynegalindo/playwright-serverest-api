import { expect } from '@playwright/test';
import { Given, Then } from '../fixtures.js';
import { iniciarSessao } from '../support/sessao.js';

Given('que existe um administrador cadastrado', async ({ admin, cenario }) => {
  cenario.usuario = admin.payload;
});

Given('que existe um cliente cadastrado', async ({ cliente, cenario }) => {
  cenario.usuario = cliente.payload;
});

Given('que tenho uma sessão de administrador', async ({ page, admin, usuariosClient }) => {
  const token = await usuariosClient.login(admin.payload);
  await iniciarSessao(page, { ...admin.payload, token });
});

Then('vejo o alerta {string}', async ({ alertas }, mensagem) => {
  await expect(alertas.comTexto(mensagem)).toBeVisible();
});

Then('vejo os alertas:', async ({ alertas }, tabela) => {
  for (const [mensagem] of tabela.raw()) {
    await expect(alertas.comTexto(mensagem)).toBeVisible();
  }
});
