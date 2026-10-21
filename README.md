# Testes de API com Playwright e ServeRest

[![API tests](https://github.com/allynegalindo/playwright-serverest-api/actions/workflows/api-tests.yml/badge.svg)](https://github.com/allynegalindo/playwright-serverest-api/actions/workflows/api-tests.yml)
[![Relatório](https://img.shields.io/badge/relat%C3%B3rio-GitHub%20Pages-2ea44f)](https://allynegalindo.github.io/playwright-serverest-api/)

Automação de testes de API com [Playwright](https://playwright.dev) sobre a [ServeRest](https://serverest.dev), feita para responder a uma pergunta: **como escrever testes de API que rodam em paralelo, validam o contrato e não deixam lixo na base?**

📊 **[Ver o último relatório de execução](https://allynegalindo.github.io/playwright-serverest-api/)**

## Destaques

- **Dados próprios por teste:** cada teste cria o que precisa pela API e apaga ao final, mesmo se falhar.
- **Rede de segurança para testes negativos:** se a API aceitar por engano algo que deveria recusar, o registro criado ainda é apagado.
- **Validação de contrato:** as respostas são validadas contra JSON Schema, com um matcher próprio (`toMatchSchema`).
- **Técnicas de teste explícitas:** particionamento de equivalência, análise de valor limite e testes orientados a dados.
- **Bug documentado no código:** um defeito real da API vira um teste de "falha esperada", que avisa quando for corrigido.
- **Pipeline completo:** lint, testes em paralelo, retry que expõe flakiness e relatório publicado no GitHub Pages.

## O problema

Uma prática comum é o teste buscar um dado qualquer que já existe na base: fazer `GET /usuarios`, pegar o primeiro da lista e usá-lo para logar ou editar. Isso causa problemas:

- **Testes frágeis:** o resultado depende do que estiver na base naquele momento.
- **Dados alterados sem controle:** editar um registro "qualquer" pode quebrar outro teste ou mexer em dados de outras pessoas.
- **Lixo acumulado:** registros criados para teste e nunca removidos poluem o ambiente.
- **Paralelismo impossível:** dois testes podem pegar e alterar o mesmo dado ao mesmo tempo.

## A solução

Cada teste é dono dos próprios dados:

1. **POST:** cria o dado necessário pela API do produto.
2. **Teste:** executa o cenário usando esse dado.
3. **DELETE:** apaga o dado pela API, **mesmo se o teste falhar**.

No Playwright, isso é feito com [fixtures](https://playwright.dev/docs/test-fixtures):

```js
produto: async ({ produtosClient }, use) => {
  const payload = buildProduto();
  const id = await produtosClient.create(payload); // POST
  await use({ id, payload });                      // teste roda
  await produtosClient.remove(id);                 // DELETE, mesmo se o teste falhar
},
```

O teste só declara do que precisa:

```js
test('edita produto criado pela própria automação', async ({ produtosClient, produto }) => {
  // "produto" já existe aqui e será apagado ao final
});
```

Quando uma fixture depende de outra (o produto exige um usuário administrador), o Playwright desmonta na ordem inversa: primeiro apaga o produto, depois o usuário.

O arquivo [`tests/exemplo-ciclo-explicito.spec.js`](tests/exemplo-ciclo-explicito.spec.js) mostra o mesmo ciclo escrito por extenso, sem fixture, para facilitar o entendimento.

### E os testes negativos?

Um teste que espera `400` para um e-mail duplicado não deveria criar nada. Mas, se a API tiver um bug e aceitar o cadastro, o teste falha **e** deixa um registro para trás.

Para evitar isso, os clients guardam todo registro que a API criou (status `201`). Ao final do teste, a fixture apaga o que ainda existir:

```js
usuariosClient: async ({ request }, use) => {
  const client = new UsuariosClient(request);
  await use(client);
  await client.cleanup(); // apaga usuários que algum teste criou por engano
},
```

## Estratégia de testes

| Área | O que é verificado | Técnica |
| --- | --- | --- |
| Login | Sucesso, senha errada, campos obrigatórios | Particionamento de equivalência |
| Usuários | Contrato, e-mail duplicado, campos obrigatórios, formatos inválidos, campo não permitido | Contrato (JSON Schema), testes orientados a dados |
| Produtos | Contrato, edição, nome duplicado, produto inexistente | Contrato (JSON Schema) |
| Preço e quantidade | `preco` inteiro ≥ 1 e `quantidade` inteiro ≥ 0 | Análise de valor limite |
| Autorização | Usuário comum (403), sem token e token inválido (401) | Testes orientados a dados |

Os cenários marcados com `@smoke` cobrem o caminho principal de cada recurso e rodam em segundos (`npm run test:smoke`).

### Bug encontrado

`GET /usuarios` devolve a **senha dos usuários em texto puro**. O teste [`não expõe a senha na listagem de usuários`](tests/usuarios.spec.js) está marcado com `test.fail` e com a anotação `bug`:

- hoje ele "passa", porque a falha é esperada, e o pipeline continua verde;
- quando a API for corrigida, ele passa a falhar e avisa que a marcação pode ser removida.

Assim o defeito fica registrado junto do código, sem ser esquecido e sem deixar a suíte vermelha.

## Decisões técnicas

- **Playwright para API:** o mesmo runner serve para API e E2E, com fixtures, paralelismo e relatório HTML prontos, sem precisar de outra biblioteca de HTTP.
- **Clients com dois tipos de método:** `post()` devolve a resposta crua, para testes que verificam erros. `create()` já valida o sucesso e devolve o id, para quando o cadastro é só preparação do teste.
- **`toEqual` nas mensagens de erro:** compara o corpo inteiro, então um campo de erro a mais ou a menos faz o teste falhar.
- **`additionalProperties: false` nos schemas:** um campo novo na resposta quebra o teste de contrato de propósito. Mudança de contrato precisa ser percebida.
- **Retry só no CI, e só 1:** um teste que passa apenas na segunda tentativa aparece como *flaky* no relatório, em vez de ser escondido.
- **Validação do DELETE pela mensagem:** a ServeRest responde `200` mesmo quando não apaga nada, então o status sozinho não basta.

## Como rodar

Pré-requisito: **Node.js 22.12 ou mais recente**.

```bash
npm install
npm test               # sobe a ServeRest local e roda todos os testes
npm run test:smoke     # só os cenários @smoke
npm run lint           # ESLint com as regras do plugin do Playwright
npm run test:report    # abre o relatório HTML
```

A ServeRest sobe automaticamente em `http://localhost:3000`. Para rodar contra outro ambiente:

```bash
API_URL=https://serverest.dev npm test
```

## Estrutura

```
├── api/                 # clients da API (uma classe por recurso)
├── data/                # factories que geram dados únicos para cada teste
├── schemas/             # contratos (JSON Schema) das respostas
├── support/             # matcher toMatchSchema
├── tests/               # cenários de teste
├── fixtures.js          # setup (POST) e teardown (DELETE) dos dados
└── playwright.config.js # baseURL, paralelismo, retries e servidor local
```

## Pipeline

A cada pull request e a cada push na `main`, o GitHub Actions:

1. roda o **lint**, em paralelo com os testes;
2. roda os **testes**, com `forbidOnly` (um `test.only` esquecido quebra o build) e anotações de falha direto no PR;
3. **publica o relatório** HTML no GitHub Pages (só na `main`), mesmo quando algum teste falha.

> **Limitação:** se o processo for interrompido à força (Ctrl+C, pipeline cancelada), o teardown não roda. O prefixo `auto-` nos dados facilita uma limpeza periódica como última rede de segurança.

## Licença

[MIT](LICENSE)
