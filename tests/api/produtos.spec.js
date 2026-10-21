import { test, expect } from '../../fixtures.js';
import { ProdutosClient } from '../../api/produtos.client.js';
import { buildProduto } from '../../data/produto.factory.js';
import { produtoSchema, erroValidacaoSchema } from '../../schemas/index.js';

test.describe('Cadastro de produtos', () => {
  // Editar um produto "qualquer" da base alteraria dados de outras pessoas e
  // deixaria a base suja. Aqui o produto é criado e apagado pela fixture.
  test('edita produto criado pela própria automação', { tag: '@smoke' }, async ({ produtosClient, produto }) => {
    const alterado = { ...produto.payload, preco: 250 };

    const res = await produtosClient.update(produto.id, alterado);
    await expect(res).toBeOK();
    expect(await res.json()).toMatchObject({ message: 'Registro alterado com sucesso' });

    const atual = await produtosClient.get(produto.id);
    expect(await atual.json()).toMatchObject({ ...alterado, _id: produto.id });
  });

  test('produto cadastrado segue o contrato da API', { tag: '@smoke' }, async ({ produtosClient, produto }) => {
    const res = await produtosClient.get(produto.id);

    await expect(res).toBeOK();
    const body = await res.json();
    expect(body).toMatchSchema(produtoSchema);
    expect(body).toEqual({ ...produto.payload, _id: produto.id });
  });

  test('não aceita nome repetido', async ({ produtosClient, produto }) => {
    const res = await produtosClient.post(buildProduto({ nome: produto.payload.nome }));

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ message: 'Já existe produto com esse nome' });
  });

  test('informa produto inexistente', async ({ produtosClient }) => {
    const res = await produtosClient.get('AAAAAAAAAAAAAAAA');

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ message: 'Produto não encontrado' });
  });
});

// Análise de valor limite: preço precisa ser inteiro >= 1 e quantidade, inteiro >= 0
test.describe('Valores limite de preço e quantidade', () => {
  const aceitos = [
    { caso: 'o menor preço possível', preco: 1, quantidade: 1 },
    { caso: 'estoque zerado', preco: 1, quantidade: 0 },
  ];

  for (const { caso, ...valores } of aceitos) {
    test(`aceita ${caso}`, async ({ produtosClient }) => {
      // O produto criado aqui é apagado pelo cleanup() do produtosClient
      const res = await produtosClient.post(buildProduto(valores));

      expect(res.status()).toBe(201);
    });
  }

  const recusados = [
    { campo: 'preco', valor: 0, mensagem: 'preco deve ser um número positivo' },
    { campo: 'preco', valor: 1.5, mensagem: 'preco deve ser um inteiro' },
    { campo: 'quantidade', valor: -1, mensagem: 'quantidade deve ser maior ou igual a 0' },
    { campo: 'quantidade', valor: 1.5, mensagem: 'quantidade deve ser um inteiro' },
  ];

  for (const { campo, valor, mensagem } of recusados) {
    test(`recusa ${campo} = ${valor}`, async ({ produtosClient }) => {
      const res = await produtosClient.post(buildProduto({ [campo]: valor }));

      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body).toMatchSchema(erroValidacaoSchema);
      expect(body).toEqual({ [campo]: mensagem });
    });
  }
});

test.describe('Autorização em produtos', () => {
  test('usuário comum não cadastra produto', async ({ apiRequest, usuariosClient, cliente, produtosClient }) => {
    const token = await usuariosClient.login(cliente.payload);

    const res = await new ProdutosClient(apiRequest, token).post(buildProduto());
    await produtosClient.track(res); // se a API aceitar por engano, o admin apaga ao final

    expect(res.status()).toBe(403);
    expect(await res.json()).toEqual({ message: 'Rota exclusiva para administradores' });
  });

  const tokensInvalidos = [
    { caso: 'sem token', token: undefined },
    { caso: 'com token malformado', token: 'Bearer token-invalido' },
  ];

  for (const { caso, token } of tokensInvalidos) {
    test(`recusa cadastro ${caso}`, async ({ apiRequest, produtosClient }) => {
      const res = await new ProdutosClient(apiRequest, token).post(buildProduto());
      await produtosClient.track(res);

      expect(res.status()).toBe(401);
      expect(await res.json()).toEqual({
        message: 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
      });
    });
  }
});
