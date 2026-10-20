import { randomUUID } from 'node:crypto';

export const buildProduto = (overrides = {}) => ({
  nome: `auto-produto-${randomUUID().slice(0, 8)}`, // a ServeRest exige nome único
  preco: 100,
  descricao: 'Produto criado por teste automatizado',
  quantidade: 10,
  ...overrides,
});
