import { expect } from '@playwright/test';

export class UsuariosClient {
  constructor(request) {
    this.request = request;
  }

  async create(payload) {
    const res = await this.request.post('/usuarios', { data: payload });
    await expect(res).toBeOK();
    const { _id } = await res.json();
    return _id;
  }

  get(id) {
    return this.request.get(`/usuarios/${id}`);
  }

  async remove(id) {
    const res = await this.request.delete(`/usuarios/${id}`);
    await expect(res).toBeOK();
    // A ServeRest responde 200 mesmo quando não apaga nada, então o status não basta
    expect(await res.json()).toMatchObject({ message: 'Registro excluído com sucesso' });
  }

  async login({ email, password }) {
    const res = await this.request.post('/login', { data: { email, password } });
    await expect(res).toBeOK();
    const { authorization } = await res.json();
    return authorization; // já vem no formato "Bearer <token>"
  }
}
