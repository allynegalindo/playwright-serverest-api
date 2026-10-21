import { mergeTests } from '@playwright/test';
import { test as bddTest, createBdd } from 'playwright-bdd';
import { test as dadosTest } from '../../fixtures.js';
import { buildUsuario } from '../../data/usuario.factory.js';
import { buildProduto } from '../../data/produto.factory.js';
import { LoginPage } from './pages/login.page.js';
import { PainelAdminPage } from './pages/painel-admin.page.js';
import { LojaPage } from './pages/loja.page.js';
import { CadastroUsuarioPage } from './pages/cadastro-usuario.page.js';
import { CadastroProdutoPage } from './pages/cadastro-produto.page.js';
import { ListaProdutosPage } from './pages/lista-produtos.page.js';
import { Alertas } from './pages/alertas.component.js';

// Reaproveita as fixtures de dados da API (admin, cliente, produto...) no E2E
export const test = mergeTests(bddTest, dadosTest).extend({
  // Estado compartilhado entre os passos de um mesmo cenário
  cenario: async ({}, use) => {
    await use({});
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  painelAdminPage: async ({ page }, use) => use(new PainelAdminPage(page)),
  lojaPage: async ({ page }, use) => use(new LojaPage(page)),
  cadastroUsuarioPage: async ({ page }, use) => use(new CadastroUsuarioPage(page)),
  cadastroProdutoPage: async ({ page }, use) => use(new CadastroProdutoPage(page)),
  listaProdutosPage: async ({ page }, use) => use(new ListaProdutosPage(page)),
  alertas: async ({ page }, use) => use(new Alertas(page)),

  // Dados que o cenário vai cadastrar pela tela. Como o teste não conhece o id,
  // o teardown apaga pela API usando o nome ou e-mail reservado aqui
  novoProduto: async ({ produtosClient }, use) => {
    const payload = buildProduto();
    await use(payload);
    await produtosClient.discardByNome(payload.nome);
  },

  novoUsuario: async ({ usuariosClient }, use) => {
    const payload = buildUsuario({ administrador: 'false' });
    await use(payload);
    await usuariosClient.discardByEmail(payload.email);
  },
});

export const { Given, When, Then } = createBdd(test);
