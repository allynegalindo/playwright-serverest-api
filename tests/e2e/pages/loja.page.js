export class LojaPage {
  constructor(page) {
    this.page = page;
    this.titulo = page.getByRole('heading', { name: 'Serverest Store' });
  }
}
