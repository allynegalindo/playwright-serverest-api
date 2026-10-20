import { test, expect } from '../fixtures.js';
import { buildUsuario } from '../data/usuario.factory.js';

// Exemplo didático: o mesmo ciclo que as fixtures fazem, escrito por extenso
test('ciclo completo: cria, testa e apaga o usuário via API', async ({ usuariosClient }) => {
  const payload = buildUsuario();
  const id = await usuariosClient.create(payload);                 // 1. POST

  try {
    const res = await usuariosClient.get(id);                      // 2. teste
    await expect(res).toBeOK();
    expect(await res.json()).toMatchObject({ ...payload, _id: id });
  } finally {
    await usuariosClient.remove(id);                               // 3. DELETE
  }

  const depois = await usuariosClient.get(id);                     // 4. não sobrou lixo
  expect(depois.status()).toBe(400);
  expect(await depois.json()).toMatchObject({ message: 'Usuário não encontrado' });
});
