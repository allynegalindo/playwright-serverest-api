# BUG-001: Listagem de usuários expõe a senha em texto puro

| | |
| --- | --- |
| **Severidade** | Crítica |
| **Prioridade** | Alta |
| **Status** | Aberto, documentado na suíte com `test.fail` |
| **Componente** | API: `GET /usuarios` (o mesmo acontece em `GET /usuarios/{id}`) |
| **Ambiente** | ServeRest 3.2.2 local e API pública (serverest.dev) |
| **Encontrado em** | 21/10/2026, durante a criação dos testes de contrato |
| **Reportado por** | Allyne Galindo |

## Descrição

A listagem de usuários devolve o campo `password` com a senha de cada usuário **em texto puro**. A rota não exige autenticação, então qualquer pessoa consegue ver a senha de todos os usuários cadastrados.

## Passos para reproduzir

1. Cadastre um usuário:

   ```http
   POST /usuarios
   Content-Type: application/json

   { "nome": "Fulana", "email": "fulana@teste.com", "password": "minha-senha", "administrador": "false" }
   ```

2. Sem fazer login, consulte a listagem filtrando pelo e-mail:

   ```http
   GET /usuarios?email=fulana@teste.com
   ```

## Resultado esperado

A resposta não traz a senha, nem em texto puro nem criptografada. Senhas não devem sair da API.

## Resultado obtido

```json
{
  "quantidade": 1,
  "usuarios": [
    {
      "nome": "Fulana",
      "email": "fulana@teste.com",
      "password": "minha-senha",
      "administrador": "false",
      "_id": "mqpRj393EhNtrn6Z"
    }
  ]
}
```

## Impacto

- **Qualquer pessoa** obtém e-mail e senha de **todos** os usuários, inclusive administradores, e pode entrar com as contas deles.
- Muita gente repete senhas em vários serviços, então o vazamento pode afetar contas fora da loja.
- Também viola a LGPD, que exige proteger dados pessoais.

## Evidência na suíte

O teste [`não expõe a senha na listagem de usuários`](../../tests/api/usuarios.spec.js) reproduz o problema a cada execução. Ele está marcado com `test.fail` e com a anotação `bug`:

- hoje ele "passa", porque a falha é esperada, e o pipeline continua verde;
- quando a API for corrigida, ele passa a falhar e avisa que a marcação pode ser removida.

## Sugestão de correção

- Remover o campo `password` de todas as respostas de usuário.
- Guardar as senhas com hash (bcrypt ou argon2), nunca em texto puro.
- Avaliar se a listagem de usuários deve exigir autenticação de administrador.

## Observação

A ServeRest é uma API feita para estudo de testes, e esse comportamento pode ser intencional para fins didáticos. O registro segue o mesmo padrão usado num sistema real, porque é assim que o defeito seria tratado em produção.
