import { expect } from '@playwright/test';
import { When, Then } from '../fixtures.js';
import { buildUsuario } from '../../../data/usuario.factory.js';

When('me cadastro com dados válidos', async ({ cadastroUsuarioPage, novoUsuario, cenario }) => {
  cenario.usuario = novoUsuario;
  await cadastroUsuarioPage.goto();
  await cadastroUsuarioPage.cadastrarUsuario(novoUsuario);
});

// A API não permite dois usuários com o mesmo e-mail, então este passo não cria nada
When('tento me cadastrar com o e-mail dele', async ({ cadastroUsuarioPage, cenario }) => {
  await cadastroUsuarioPage.goto();
  await cadastroUsuarioPage.cadastrarUsuario(buildUsuario({ email: cenario.usuario.email }));
});

Then('minha conta fica salva na API como cliente', async ({ usuariosClient, cenario }) => {
  const { nome, email } = cenario.usuario;
  const { usuarios } = await (await usuariosClient.list({ email })).json();

  expect(usuarios).toHaveLength(1);
  expect(usuarios[0]).toMatchObject({ nome, email, administrador: 'false' });
});
