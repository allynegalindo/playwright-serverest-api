export class CadastroProdutoPage {
  constructor(page) {
    this.page = page;
    this.nome = page.getByTestId('nome');
    this.preco = page.getByTestId('preco');
    this.descricao = page.getByTestId('descricao');
    this.quantidade = page.getByTestId('quantity');
    this.cadastrar = page.getByTestId('cadastarProdutos'); // grafia do próprio front
  }

  async goto() {
    await this.page.goto('/admin/cadastrarprodutos');
  }

  async cadastrarProduto({ nome, preco, descricao, quantidade }) {
    await this.nome.fill(nome);
    await this.preco.fill(String(preco));
    await this.descricao.fill(descricao);
    await this.quantidade.fill(String(quantidade));
    await this.cadastrar.click();
  }
}
