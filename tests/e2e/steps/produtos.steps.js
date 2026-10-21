import { expect } from '../../../fixtures.js';
import { Given, When, Then } from '../fixtures.js';
import { produtoSchema } from '../../../schemas/index.js';

Given('que existe um produto cadastrado', async ({ produto, cenario }) => {
  cenario.produto = produto.payload;
});

When('cadastro um novo produto', async ({ cadastroProdutoPage, novoProduto, cenario }) => {
  cenario.produto = novoProduto;
  await cadastroProdutoPage.goto();
  await cadastroProdutoPage.cadastrarProduto(novoProduto);
});

When('tento cadastrar um produto sem preencher os campos', async ({ cadastroProdutoPage }) => {
  await cadastroProdutoPage.goto();
  await cadastroProdutoPage.cadastrar.click();
});

When('excluo o produto na lista de produtos', async ({ listaProdutosPage, cenario }) => {
  await listaProdutosPage.goto();
  await listaProdutosPage.excluir(cenario.produto.nome);
});

Then('o produto aparece na lista de produtos', async ({ page, listaProdutosPage, cenario }) => {
  await expect(page).toHaveURL(/\/admin\/listarprodutos$/); // o front redireciona sozinho
  await expect(listaProdutosPage.linha(cenario.produto.nome)).toBeVisible();
});

Then('o produto não aparece mais na lista', async ({ listaProdutosPage, cenario }) => {
  await expect(listaProdutosPage.linha(cenario.produto.nome)).toHaveCount(0);
});

// A tela mostrar o produto não garante que ele foi salvo certo: a verificação final é na API
Then('o produto fica salvo na API com os dados informados', async ({ produtosClient, cenario }) => {
  const { produtos } = await (await produtosClient.list({ nome: cenario.produto.nome })).json();

  expect(produtos).toHaveLength(1);
  expect(produtos[0]).toMatchSchema(produtoSchema);
  expect(produtos[0]).toMatchObject(cenario.produto);
});

Then('o produto não existe mais na API', async ({ produtosClient, cenario }) => {
  const { produtos } = await (await produtosClient.list({ nome: cenario.produto.nome })).json();

  expect(produtos).toHaveLength(0);
});
