import { test as base, expect } from '@playwright/test';
import { UsuariosClient } from './api/usuarios.client.js';
import { ProdutosClient } from './api/produtos.client.js';
import { buildUsuario } from './data/usuario.factory.js';
import { buildProduto } from './data/produto.factory.js';

export const test = base.extend({
  usuariosClient: async ({ request }, use) => {
    await use(new UsuariosClient(request));
  },

  admin: async ({ usuariosClient }, use) => {
    const payload = buildUsuario();
    const id = await usuariosClient.create(payload); // POST
    await use({ id, payload });                      // teste roda
    await usuariosClient.remove(id);                 // DELETE, mesmo se o teste falhar
  },

  produtosClient: async ({ request, usuariosClient, admin }, use) => {
    const token = await usuariosClient.login(admin.payload);
    await use(new ProdutosClient(request, token));
  },

  // Depende de "admin": o Playwright desmonta na ordem inversa,
  // então o produto é apagado antes do usuário
  produto: async ({ produtosClient }, use) => {
    const payload = buildProduto();
    const id = await produtosClient.create(payload);
    await use({ id, payload });
    await produtosClient.remove(id);
  },
});

export { expect };
