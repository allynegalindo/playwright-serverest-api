import { test as base, expect as baseExpect } from '@playwright/test';
import { UsuariosClient } from './api/usuarios.client.js';
import { ProdutosClient } from './api/produtos.client.js';
import { buildUsuario } from './data/usuario.factory.js';
import { buildProduto } from './data/produto.factory.js';
import { schemaMatchers } from './support/matchers.js';

// Ordem de desmontagem (inversa à de criação):
// produto → produtosClient.cleanup() → admin/cliente → usuariosClient.cleanup()
export const test = base.extend({
  usuariosClient: async ({ request }, use) => {
    const client = new UsuariosClient(request);
    await use(client);
    await client.cleanup(); // apaga usuários que algum teste criou por engano
  },

  admin: async ({ usuariosClient }, use) => {
    const payload = buildUsuario();
    const id = await usuariosClient.create(payload); // POST
    await use({ id, payload });                      // teste roda
    await usuariosClient.remove(id);                 // DELETE, mesmo se o teste falhar
  },

  cliente: async ({ usuariosClient }, use) => {
    const payload = buildUsuario({ administrador: 'false' });
    const id = await usuariosClient.create(payload);
    await use({ id, payload });
    await usuariosClient.remove(id);
  },

  produtosClient: async ({ request, usuariosClient, admin }, use) => {
    const token = await usuariosClient.login(admin.payload);
    const client = new ProdutosClient(request, token);
    await use(client);
    await client.cleanup(); // roda antes do teardown do admin, que é dono do token
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

export const expect = baseExpect.extend(schemaMatchers);
