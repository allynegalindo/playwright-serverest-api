import { test, expect } from '../fixtures.js';
import { buildUsuario } from '../data/usuario.factory.js';
import { usuarioSchema, loginSchema, erroValidacaoSchema } from '../schemas/index.js';

test.describe('Login', () => {
  test('faz login com usuário criado pela própria automação', { tag: '@smoke' }, async ({ usuariosClient, admin }) => {
    const res = await usuariosClient.postLogin(admin.payload);

    await expect(res).toBeOK();
    const body = await res.json();
    expect(body).toMatchSchema(loginSchema);
    expect(body.message).toBe('Login realizado com sucesso');
  });

  test('recusa senha errada', async ({ usuariosClient, admin }) => {
    const res = await usuariosClient.postLogin({ ...admin.payload, password: 'senha-errada' });

    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ message: 'Email e/ou senha inválidos' });
  });

  test('exige e-mail e senha', async ({ usuariosClient }) => {
    const res = await usuariosClient.postLogin({});

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({
      email: 'email é obrigatório',
      password: 'password é obrigatório',
    });
  });
});

test.describe('Cadastro de usuários', () => {
  test('usuário cadastrado segue o contrato da API', { tag: '@smoke' }, async ({ usuariosClient, admin }) => {
    const res = await usuariosClient.get(admin.id);

    await expect(res).toBeOK();
    const body = await res.json();
    expect(body).toMatchSchema(usuarioSchema);
    expect(body).toEqual({ ...admin.payload, _id: admin.id });
  });

  test('não aceita e-mail já cadastrado', async ({ usuariosClient, admin }) => {
    const res = await usuariosClient.post(buildUsuario({ email: admin.payload.email }));

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ message: 'Este email já está sendo usado' });
  });

  test('informa todos os campos obrigatórios de uma vez', async ({ usuariosClient }) => {
    const res = await usuariosClient.post({});

    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({
      nome: 'nome é obrigatório',
      email: 'email é obrigatório',
      password: 'password é obrigatório',
      administrador: 'administrador é obrigatório',
    });
  });

  const invalidos = [
    { campo: 'email', valor: 'sem-arroba.com', mensagem: 'email deve ser um email válido' },
    { campo: 'administrador', valor: 'sim', mensagem: "administrador deve ser 'true' ou 'false'" },
    { campo: 'apelido', valor: 'qa', mensagem: 'apelido não é permitido' },
  ];

  for (const { campo, valor, mensagem } of invalidos) {
    test(`recusa ${campo} = ${JSON.stringify(valor)}`, async ({ usuariosClient }) => {
      const res = await usuariosClient.post(buildUsuario({ [campo]: valor }));

      expect(res.status()).toBe(400);
      const body = await res.json();
      expect(body).toMatchSchema(erroValidacaoSchema);
      expect(body).toEqual({ [campo]: mensagem });
    });
  }

  // Sem fixture: o próprio cenário é a exclusão. Se o teste falhar antes do DELETE,
  // o cleanup() do usuariosClient apaga o usuário ao final
  test('apaga usuário e ele deixa de existir', async ({ usuariosClient }) => {
    const id = await usuariosClient.create(buildUsuario());

    await usuariosClient.remove(id);

    const res = await usuariosClient.get(id);
    expect(res.status()).toBe(400);
    expect(await res.json()).toEqual({ message: 'Usuário não encontrado' });
  });

  // Bug conhecido: o teste fica marcado como "falha esperada". Quando a API for corrigida,
  // ele passa a "falhar" e avisa que a marcação pode ser removida.
  test.fail(
    'não expõe a senha na listagem de usuários',
    { annotation: { type: 'bug', description: 'GET /usuarios devolve o campo password em texto puro' } },
    async ({ usuariosClient, admin }) => {
      const res = await usuariosClient.list({ email: admin.payload.email });

      await expect(res).toBeOK();
      const { usuarios } = await res.json();
      expect(usuarios).toHaveLength(1);
      expect(usuarios[0]).not.toHaveProperty('password');
    },
  );
});
