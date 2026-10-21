import { expect } from '@playwright/test';

export class UsuariosClient {
  #criados = new Set();

  constructor(request) {
    this.request = request;
  }

  // Requisição crua, para testes que verificam erros
  async post(payload) {
    const res = await this.request.post('/usuarios', { data: payload });
    await this.track(res);
    return res;
  }

  // Atalho para quando o cadastro é só preparação do teste
  async create(payload) {
    const res = await this.post(payload);
    await expect(res).toBeOK();
    const { _id } = await res.json();
    return _id;
  }

  get(id) {
    return this.request.get(`/usuarios/${id}`);
  }

  list(params) {
    return this.request.get('/usuarios', { params });
  }

  async remove(id) {
    const res = await this.request.delete(`/usuarios/${id}`);
    await expect(res).toBeOK();
    // A ServeRest responde 200 mesmo quando não apaga nada, então o status não basta
    expect(await res.json()).toMatchObject({ message: 'Registro excluído com sucesso' });
    this.#criados.delete(id);
  }

  // Apaga se ainda existir: para teardown, quando o próprio teste pode ter apagado
  async discard(id) {
    await expect(await this.request.delete(`/usuarios/${id}`)).toBeOK();
    this.#criados.delete(id);
  }

  // Para usuários cadastrados pela interface, cujo id o teste não conhece
  async discardByEmail(email) {
    const { usuarios } = await (await this.list({ email })).json();
    for (const { _id } of usuarios) await this.discard(_id);
  }

  postLogin({ email, password }) {
    return this.request.post('/login', { data: { email, password } });
  }

  async login(credentials) {
    const res = await this.postLogin(credentials);
    await expect(res).toBeOK();
    const { authorization } = await res.json();
    return authorization; // já vem no formato "Bearer <token>"
  }

  // Guarda tudo o que foi criado. Se um teste negativo criar um usuário por engano
  // (a API aceitou o que deveria recusar), o cleanup() da fixture ainda apaga
  async track(res) {
    if (res.status() === 201) this.#criados.add((await res.json())._id);
  }

  async cleanup() {
    for (const id of this.#criados) await this.discard(id);
  }
}
