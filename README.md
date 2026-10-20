# Testes de API sem lixo na base: POST → Teste → DELETE

[![API tests](https://github.com/allynegalindo/playwright-serverest-api/actions/workflows/api-tests.yml/badge.svg)](https://github.com/allynegalindo/playwright-serverest-api/actions/workflows/api-tests.yml)

Exemplo de automação de testes de API com [Playwright](https://playwright.dev) e [ServeRest](https://serverest.dev) em que **cada teste cria os próprios dados pela API e os apaga ao final**.

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

## Como rodar

Pré-requisito: **Node.js 22.12 ou mais recente**.

```bash
npm install
npm test               # sobe a ServeRest local e roda os testes
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
├── tests/               # cenários de teste
├── fixtures.js          # setup (POST) e teardown (DELETE) dos dados
└── playwright.config.js # baseURL, paralelismo e servidor local
```

## Boas práticas aplicadas

- **Dados únicos por teste:** e-mails e nomes com sufixo aleatório e prefixo `auto-`, o que permite rodar em paralelo e identificar facilmente qualquer dado que tenha sobrado.
- **Teardown garantido:** o DELETE roda mesmo quando o teste falha.
- **Validação do DELETE pela mensagem:** a ServeRest responde 200 mesmo quando não apaga nada, então o status sozinho não basta.
- **Clients isolados:** os testes não montam requisições na mão; usam métodos como `create`, `get` e `remove`.
- **Configuração por ambiente:** a URL da API vem da variável `API_URL`.

> **Limitação:** se o processo for interrompido à força (Ctrl+C, pipeline cancelada), o teardown não roda. O prefixo `auto-` facilita uma limpeza periódica como rede de segurança.

## Licença

[MIT](LICENSE)
