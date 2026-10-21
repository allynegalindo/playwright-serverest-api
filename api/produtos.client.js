import { expect } from '@playwright/test';

export class ProdutosClient {
  #token;
  #criados = new Set();

  constructor(request, token) {
    this.request = request;
    this.#token = token;
  }

  // Requisição crua, para testes que verificam erros
  async post(payload) {
    const res = await this.request.post('/produtos', { data: payload, headers: this.#auth() });
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
    return this.request.get(`/produtos/${id}`);
  }

  list(params) {
    return this.request.get('/produtos', { params });
  }

  update(id, payload) {
    return this.request.put(`/produtos/${id}`, { data: payload, headers: this.#auth() });
  }

  async remove(id) {
    const res = await this.request.delete(`/produtos/${id}`, { headers: this.#auth() });
    await expect(res).toBeOK();
    expect(await res.json()).toMatchObject({ message: 'Registro excluído com sucesso' });
    this.#criados.delete(id);
  }

  // Apaga se ainda existir: para teardown, quando o próprio teste pode ter apagado
  async discard(id) {
    await expect(await this.request.delete(`/produtos/${id}`, { headers: this.#auth() })).toBeOK();
    this.#criados.delete(id);
  }

  // Para produtos cadastrados pela interface, cujo id o teste não conhece
  async discardByNome(nome) {
    const { produtos } = await (await this.list({ nome })).json();
    for (const { _id } of produtos) await this.discard(_id);
  }

  // Mesma rede de segurança do UsuariosClient: nada criado por engano fica na base
  async track(res) {
    if (res.status() === 201) this.#criados.add((await res.json())._id);
  }

  async cleanup() {
    for (const id of this.#criados) await this.discard(id);
  }

  #auth() {
    return this.#token ? { Authorization: this.#token } : {};
  }
}
