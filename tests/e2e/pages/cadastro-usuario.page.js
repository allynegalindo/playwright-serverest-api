export class CadastroUsuarioPage {
  constructor(page) {
    this.page = page;
    this.nome = page.getByTestId('nome');
    this.email = page.getByTestId('email');
    this.senha = page.getByTestId('password');
    this.administrador = page.getByTestId('checkbox');
    this.cadastrar = page.getByTestId('cadastrar');
  }

  async goto() {
    await this.page.goto('/cadastrarusuarios');
  }

  async cadastrarUsuario({ nome, email, password, administrador }) {
    await this.nome.fill(nome);
    await this.email.fill(email);
    await this.senha.fill(password);
    await this.administrador.setChecked(administrador === 'true');
    await this.cadastrar.click();
  }
}
