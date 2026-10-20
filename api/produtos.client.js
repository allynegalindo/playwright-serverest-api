import { expect } from '@playwright/test';

export class ProdutosClient {
  #token;

  constructor(request, token) {
    this.request = request;
    this.#token = token;
  }

  async create(payload) {
    const res = await this.request.post('/produtos', {
      data: payload,
      headers: this.#auth(),
    });
    await expect(res).toBeOK();
    const { _id } = await res.json();
    return _id;
  }

  get(id) {
    return this.request.get(`/produtos/${id}`);
  }

  update(id, payload) {
    return this.request.put(`/produtos/${id}`, { data: payload, headers: this.#auth() });
  }

  async remove(id) {
    const res = await this.request.delete(`/produtos/${id}`, { headers: this.#auth() });
    await expect(res).toBeOK();
    expect(await res.json()).toMatchObject({ message: 'Registro excluído com sucesso' });
  }

  #auth() {
    return { Authorization: this.#token };
  }
}
