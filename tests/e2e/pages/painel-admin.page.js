export class PainelAdminPage {
  constructor(page) {
    this.page = page;
    this.boasVindas = page.getByRole('heading', { level: 1 });
  }
}
