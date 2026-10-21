export class ListaProdutosPage {
  constructor(page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/admin/listarprodutos');
  }

  // Os nomes gerados pela factory são únicos, então identificam uma única linha
  linha(nome) {
    return this.page.getByRole('row', { name: nome });
  }

  async excluir(nome) {
    await this.linha(nome).getByRole('button', { name: 'Excluir' }).click();
  }
}
