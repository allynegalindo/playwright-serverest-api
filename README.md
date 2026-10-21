# Testes de API e E2E com Playwright e ServeRest

[![Tests](https://github.com/allynegalindo/playwright-serverest-api/actions/workflows/api-tests.yml/badge.svg)](https://github.com/allynegalindo/playwright-serverest-api/actions/workflows/api-tests.yml)
[![Relatório](https://img.shields.io/badge/relat%C3%B3rio-GitHub%20Pages-2ea44f)](https://allynegalindo.github.io/playwright-serverest-api/)

Automação de testes com [Playwright](https://playwright.dev) sobre a [ServeRest](https://serverest.dev), cobrindo **API** e **interface (E2E com BDD)** do mesmo sistema. O projeto foi feito para responder a uma pergunta: **como escrever testes que rodam em paralelo, validam o que importa e não deixam lixo na base?**

📊 **[Ver o último relatório de execução](https://allynegalindo.github.io/playwright-serverest-api/)**

## Destaques

- **Um sistema, duas camadas:** a mesma loja testada pela API e pela interface, com clients, factories e fixtures compartilhados.
- **BDD em português:** cenários E2E escritos em Gherkin (`Dado / Quando / Então`), executados pelo Playwright com [playwright-bdd](https://github.com/vitalets/playwright-bdd).
- **Dados próprios por teste:** cada teste cria o que precisa pela API e apaga ao final, mesmo se falhar. Isso vale também para o que é cadastrado pela tela.
- **Login pela API no E2E:** só o cenário de login passa pela tela de login. Os demais começam com a sessão já injetada no navegador.
- **Validação em duas camadas:** depois de cadastrar pela tela, o teste confirma na API que o dado foi salvo corretamente.
- **Validação de contrato:** as respostas da API são validadas contra JSON Schema, com um matcher próprio (`toMatchSchema`).
- **Técnicas de teste explícitas:** particionamento de equivalência, análise de valor limite e testes orientados a dados.
- **Bug documentado no código:** um defeito real da API vira um teste de "falha esperada", que avisa quando for corrigido.
- **Pipeline completo:** lint, testes em paralelo, retry que expõe flakiness, evidências de falha (trace e screenshot) e relatório publicado no GitHub Pages.

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
  await produtosClient.discard(id);                // DELETE, mesmo se o teste falhar
},
```

O teste só declara do que precisa:

```js
test('edita produto criado pela própria automação', async ({ produtosClient, produto }) => {
  // "produto" já existe aqui e será apagado ao final
});
```

Quando uma fixture depende de outra (o produto exige um usuário administrador), o Playwright desmonta na ordem inversa: primeiro apaga o produto, depois o usuário.

### O mesmo ciclo sem fixture

Para entender o que a fixture faz por baixo, este é o mesmo ciclo escrito por extenso. O `finally` garante o DELETE mesmo se o teste falhar:

```js
test('consulta usuário criado pela própria automação', async ({ usuariosClient }) => {
  const payload = buildUsuario();
  const id = await usuariosClient.create(payload); // 1. POST

  try {
    const res = await usuariosClient.get(id);      // 2. teste
    await expect(res).toBeOK();
  } finally {
    await usuariosClient.remove(id);               // 3. DELETE
  }
});
```

Funciona, mas o `try/finally` se repetiria em todo teste. A fixture escreve esse ciclo uma vez só, e cada teste apenas declara do que precisa.

### E os testes negativos?

Um teste que espera `400` para um e-mail duplicado não deveria criar nada. Mas, se a API tiver um bug e aceitar o cadastro, o teste falha **e** deixa um registro para trás.

Para evitar isso, os clients guardam todo registro que a API criou (status `201`). Ao final do teste, a fixture apaga o que ainda existir:

```js
usuariosClient: async ({ apiRequest }, use) => {
  const client = new UsuariosClient(apiRequest);
  await use(client);
  await client.cleanup(); // apaga usuários que algum teste criou por engano
},
```

### E o que é cadastrado pela tela?

No E2E, quem cria o dado é a interface, e o teste não conhece o id. A solução é **reservar** o dado antes: a fixture gera um nome único, o cenário cadastra pela tela usando esse nome, e o teardown apaga pela API buscando pelo nome.

```js
novoProduto: async ({ produtosClient }, use) => {
  const payload = buildProduto();
  await use(payload);                                // a tela cadastra com este nome
  await produtosClient.discardByNome(payload.nome);  // e a API apaga ao final
},
```

## Testes E2E com BDD

Os cenários ficam em `tests/e2e/features`, escritos em português:

```gherkin
Funcionalidade: Gestão de produtos

  Contexto:
    Dado que tenho uma sessão de administrador

  Cenário: Cadastrar produto
    Quando cadastro um novo produto
    Então o produto aparece na lista de produtos
    E o produto fica salvo na API com os dados informados
```

Cada camada tem uma responsabilidade só:

| Camada | Pasta | Responsabilidade |
| --- | --- | --- |
| Features | `tests/e2e/features` | O comportamento esperado, em linguagem de negócio |
| Steps | `tests/e2e/steps` | Ligar cada frase do Gherkin às páginas e às verificações. Steps finos, sem seletores |
| Page Objects | `tests/e2e/pages` | Localizadores e ações de cada tela. Sem asserções |
| Fixtures | `tests/e2e/fixtures.js` | Páginas e dados de cada cenário, com limpeza garantida |
| Sessão | `tests/e2e/support/sessao.js` | Login pela API, injetado no navegador |

### Por que o login é feito pela API?

O front guarda a sessão no `localStorage`. O passo `Dado que tenho uma sessão de administrador` cria o usuário e faz login pela API, e grava o token no navegador antes de a página abrir. Assim:

- cada cenário testa só o que se propõe a testar;
- os testes ficam mais rápidos e menos sujeitos a falhas da tela de login;
- o login pela tela continua coberto, na funcionalidade `Login`.

## Estratégia de testes

### API

| Área | O que é verificado | Técnica |
| --- | --- | --- |
| Login | Sucesso, senha errada, campos obrigatórios | Particionamento de equivalência |
| Usuários | Contrato, e-mail duplicado, campos obrigatórios, formatos inválidos, campo não permitido, exclusão | Contrato (JSON Schema), testes orientados a dados |
| Produtos | Contrato, edição, nome duplicado, produto inexistente | Contrato (JSON Schema) |
| Preço e quantidade | `preco` inteiro ≥ 1 e `quantidade` inteiro ≥ 0 | Análise de valor limite |
| Autorização | Usuário comum (403), sem token e token inválido (401) | Testes orientados a dados |

### E2E

| Funcionalidade | Cenários |
| --- | --- |
| Login | Administrador vai ao painel, cliente vai à loja, senha errada mostra erro |
| Cadastro de usuário | Cadastro válido entra na loja e fica salvo na API como cliente, e-mail já usado mostra erro |
| Gestão de produtos | Cadastrar (tela e API), excluir (tela e API), formulário vazio mostra os campos obrigatórios |

O E2E cobre os fluxos que dependem da interface. Regras de validação detalhadas, como os valores limite, ficam na API, onde o teste é mais rápido e estável.

Os cenários marcados com `@smoke` cobrem o caminho principal de cada funcionalidade (`npm run test:smoke`).

### Bug encontrado

`GET /usuarios` devolve a **senha dos usuários em texto puro**. O teste [`não expõe a senha na listagem de usuários`](tests/api/usuarios.spec.js) está marcado com `test.fail` e com a anotação `bug`:

- hoje ele "passa", porque a falha é esperada, e o pipeline continua verde;
- quando a API for corrigida, ele passa a falhar e avisa que a marcação pode ser removida.

Assim o defeito fica registrado junto do código, sem ser esquecido e sem deixar a suíte vermelha.

## Decisões técnicas

- **Playwright para API e E2E:** um runner só, com fixtures, paralelismo e relatório compartilhados entre as duas camadas.
- **playwright-bdd em vez de Cucumber:** os cenários Gherkin viram testes nativos do Playwright, então o BDD não abre mão de paralelismo, fixtures, trace e relatório HTML.
- **Clients com dois tipos de método:** `post()` devolve a resposta crua, para testes que verificam erros. `create()` já valida o sucesso e devolve o id, para quando o cadastro é só preparação do teste.
- **`remove()` estrito e `discard()` tolerante:** `remove()` confere a mensagem de exclusão e é usado quando a exclusão é o que está sendo testado. O teardown usa `discard()`, que aceita o registro já apagado, porque a limpeza não deve derrubar um teste por algo que ele não verifica.
- **Page Objects sem asserções:** as páginas só sabem localizar e agir. Quem decide o que é certo ou errado são os steps.
- **Seletores por `data-testid` e papel acessível:** não dependem de layout nem de classes CSS.
- **`toEqual` nas mensagens de erro:** compara o corpo inteiro, então um campo de erro a mais ou a menos faz o teste falhar.
- **`additionalProperties: false` nos schemas:** um campo novo na resposta quebra o teste de contrato de propósito. Mudança de contrato precisa ser percebida.
- **Retry só no CI, e só 1:** um teste que passa apenas na segunda tentativa aparece como *flaky* no relatório, em vez de ser escondido.
- **Timeout de asserção de 10s no E2E, medido:** no ambiente público, o cadastro de usuário leva de 4 a 5,5s até redirecionar. O limite foi ajustado com base nessa medição, sem `waitForTimeout` fixo.
- **Validação do DELETE pela mensagem:** a ServeRest responde `200` mesmo quando não apaga nada, então o status sozinho não basta.

## Ambientes

| Projeto | Front | API | Por quê |
| --- | --- | --- | --- |
| `api` | - | ServeRest local, iniciada automaticamente | Rápido, isolado e sem depender de rede |
| `e2e` | [front.serverest.dev](https://front.serverest.dev) | [serverest.dev](https://serverest.dev) | O front público só conversa com a API pública |

As URLs podem ser trocadas pelas variáveis `API_URL`, `FRONT_URL` e `FRONT_API_URL`.

## Como rodar

Pré-requisito: **Node.js 22.12 ou mais recente**.

```bash
npm install
npx playwright install chromium   # navegador para o E2E

npm test               # API + E2E
npm run test:api       # só API
npm run test:e2e       # só E2E
npm run test:smoke     # só os cenários @smoke
npm run lint           # ESLint com as regras do plugin do Playwright
npm run test:report    # abre o relatório HTML
```

## Estrutura

```
├── api/                    # clients da API (uma classe por recurso)
├── data/                   # factories que geram dados únicos para cada teste
├── schemas/                # contratos (JSON Schema) das respostas
├── support/                # matcher toMatchSchema
├── fixtures.js             # dados criados e apagados pela API (usados pela API e pelo E2E)
├── tests/
│   ├── api/                # specs de API
│   └── e2e/
│       ├── features/       # cenários em Gherkin
│       ├── steps/          # definição dos passos
│       ├── pages/          # Page Objects
│       ├── support/        # sessão injetada no navegador
│       └── fixtures.js     # páginas e dados cadastrados pela tela
└── playwright.config.js    # projetos api e e2e, retries, evidências e servidor local
```

## Pipeline

A cada pull request e a cada push na `main`, o GitHub Actions:

1. roda o **lint**, em paralelo com os testes;
2. roda os **testes de API e E2E**, com `forbidOnly` (um `test.only` esquecido quebra o build) e anotações de falha direto no PR;
3. guarda **trace e screenshot** de cada cenário E2E que falhar, como evidência para investigar;
4. **publica o relatório** HTML no GitHub Pages (só na `main`), mesmo quando algum teste falha.

## Limitações conhecidas

- **Interrupção forçada:** se o processo for interrompido (Ctrl+C, pipeline cancelada), o teardown não roda. Os prefixos `qa.auto-` e `auto-produto-` facilitam uma limpeza periódica.
- **Ambiente público compartilhado:** o E2E roda no front e na API públicos da ServeRest, usados por outras pessoas ao mesmo tempo. Lentidão ou registros apagados por terceiros podem causar falhas que não são do sistema testado. O retry no CI e o relatório de *flaky* ajudam a separar uma coisa da outra.

## Licença

[MIT](LICENSE)
