export class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = page.getByTestId('email');
    this.senha = page.getByTestId('senha');
    this.entrar = page.getByTestId('entrar');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login({ email, password }) {
    await this.email.fill(email);
    await this.senha.fill(password);
    await this.entrar.click();
  }
}
