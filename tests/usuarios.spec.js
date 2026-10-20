import { test, expect } from '../fixtures.js';

test('faz login com usuário criado pela própria automação', async ({ request, admin }) => {
  const res = await request.post('/login', {
    data: { email: admin.payload.email, password: admin.payload.password },
  });

  await expect(res).toBeOK();
  expect(await res.json()).toMatchObject({ message: 'Login realizado com sucesso' });
});
