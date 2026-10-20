import { randomUUID } from 'node:crypto';

export const buildUsuario = (overrides = {}) => ({
  nome: 'QA Automação',
  email: `qa.auto-${randomUUID().slice(0, 8)}@teste.com`, // único e fácil de identificar
  password: 'teste123',
  administrador: 'true',
  ...overrides,
});
