// Alertas de sucesso e erro, iguais em todas as telas do front
export class Alertas {
  constructor(page) {
    this.page = page;
  }

  comTexto(mensagem) {
    return this.page.getByRole('alert').filter({ hasText: mensagem });
  }
}
