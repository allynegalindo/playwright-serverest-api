import { test as base, expect as baseExpect } from '@playwright/test';
import { UsuariosClient } from './api/usuarios.client.js';
import { ProdutosClient } from './api/produtos.client.js';
import { buildUsuario } from './data/usuario.factory.js';
import { buildProduto } from './data/produto.factory.js';
import { schemaMatchers } from './support/matchers.js';

// Ordem de desmontagem (inversa à de criação):
// produto → produtosClient.cleanup() → admin/cliente → usuariosClient.cleanup()
//
// O teardown usa discard(), que aceita o registro já apagado: ele não deve derrubar
// o teste por algo que o teste não verifica (o próprio cenário ou outra pessoa no
// ambiente compartilhado pode ter apagado). A exclusão é verificada com remove(),
// nos testes que existem para isso.
export const test = base.extend({
  // Cada projeto do playwright.config.js informa a sua API (local ou pública)
  apiURL: ['http://localhost:3000', { option: true }],

  // Contexto HTTP só para a API. No E2E o baseURL do "request" padrão aponta para o
  // front, mas os dados continuam sendo criados e apagados pela API
  apiRequest: async ({ playwright, apiURL }, use) => {
    const context = await playwright.request.newContext({
      baseURL: apiURL,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(context);
    await context.dispose();
  },

  usuariosClient: async ({ apiRequest }, use) => {
    const client = new UsuariosClient(apiRequest);
    await use(client);
    await client.cleanup(); // apaga usuários que algum teste criou por engano
  },

  admin: async ({ usuariosClient }, use) => {
    const payload = buildUsuario();
    const id = await usuariosClient.create(payload); // POST
    await use({ id, payload });                      // teste roda
    await usuariosClient.discard(id);                // DELETE, mesmo se o teste falhar
  },

  cliente: async ({ usuariosClient }, use) => {
    const payload = buildUsuario({ administrador: 'false' });
    const id = await usuariosClient.create(payload);
    await use({ id, payload });
    await usuariosClient.discard(id);
  },

  produtosClient: async ({ apiRequest, usuariosClient, admin }, use) => {
    const token = await usuariosClient.login(admin.payload);
    const client = new ProdutosClient(apiRequest, token);
    await use(client);
    await client.cleanup(); // roda antes do teardown do admin, que é dono do token
  },

  // Depende de "admin": o Playwright desmonta na ordem inversa,
  // então o produto é apagado antes do usuário
  produto: async ({ produtosClient }, use) => {
    const payload = buildProduto();
    const id = await produtosClient.create(payload);
    await use({ id, payload });
    await produtosClient.discard(id);
  },
});

export const expect = baseExpect.extend(schemaMatchers);
