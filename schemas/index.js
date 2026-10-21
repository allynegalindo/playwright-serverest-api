// Contratos das respostas da ServeRest. "additionalProperties: false" faz o teste
// falhar se a API passar a devolver um campo novo sem ninguém perceber.

const id = { type: 'string', pattern: '^[A-Za-z0-9]{16}$' };

export const usuarioSchema = {
  title: 'Usuário',
  type: 'object',
  required: ['_id', 'nome', 'email', 'password', 'administrador'],
  additionalProperties: false,
  properties: {
    _id: id,
    nome: { type: 'string', minLength: 1 },
    email: { type: 'string', pattern: '^\\S+@\\S+\\.\\S+$' },
    password: { type: 'string' }, // a API devolve a senha: ver o teste marcado como bug
    administrador: { enum: ['true', 'false'] },
  },
};

export const produtoSchema = {
  title: 'Produto',
  type: 'object',
  required: ['_id', 'nome', 'preco', 'descricao', 'quantidade'],
  additionalProperties: false,
  properties: {
    _id: id,
    nome: { type: 'string', minLength: 1 },
    preco: { type: 'integer', minimum: 1 },
    descricao: { type: 'string' },
    quantidade: { type: 'integer', minimum: 0 },
  },
};

export const loginSchema = {
  title: 'Login',
  type: 'object',
  required: ['message', 'authorization'],
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
    authorization: { type: 'string', pattern: '^Bearer \\S+$' },
  },
};

// Erros de validação vêm como { campo: 'mensagem' }
export const erroValidacaoSchema = {
  title: 'Erro de validação',
  type: 'object',
  minProperties: 1,
  additionalProperties: { type: 'string' },
};
