import { test, expect } from '../fixtures.js';

// Editar um produto "qualquer" da base alteraria dados de outras pessoas e
// deixaria a base suja. Aqui o produto é criado e apagado pela fixture.
test('edita produto criado pela própria automação', async ({ produtosClient, produto }) => {
  const alterado = { ...produto.payload, preco: 250 };

  const res = await produtosClient.update(produto.id, alterado);
  await expect(res).toBeOK();
  expect(await res.json()).toMatchObject({ message: 'Registro alterado com sucesso' });

  const atual = await produtosClient.get(produto.id);
  expect(await atual.json()).toMatchObject({ ...alterado, _id: produto.id });
});
