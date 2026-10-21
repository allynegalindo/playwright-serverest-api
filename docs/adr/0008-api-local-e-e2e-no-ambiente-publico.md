# ADR-0008: API testada localmente e E2E no ambiente público

- **Status:** Aceito
- **Data:** 21/10/2026

## Contexto

A ServeRest pode ser instalada pelo npm e rodar localmente, mas o front público ([front.serverest.dev](https://front.serverest.dev)) conversa apenas com a API pública ([serverest.dev](https://serverest.dev)). O ambiente público é compartilhado com outras pessoas e pode estar lento ou ter dados alterados por terceiros.

## Decisão

- **Projeto `api`:** roda contra uma ServeRest **local**, iniciada automaticamente pelo `webServer` do Playwright.
- **Projeto `e2e`:** roda contra o **front e a API públicos**, com a URL da API definida por projeto (opção `apiURL` das fixtures).
- Todas as URLs podem ser trocadas por variáveis de ambiente (`API_URL`, `FRONT_URL`, `FRONT_API_URL`).

## Alternativas consideradas

- **Tudo no ambiente público:** a suíte de API ficaria sujeita à lentidão e às alterações de terceiros, sem nenhum ganho.
- **Front local:** daria isolamento total ao E2E, mas a ServeRest distribui pelo npm só a API. Rodar o front localmente exigiria manter um build próprio dele, apontando para a API local, um custo maior do que o benefício para o volume atual de cenários.

## Consequências

- A suíte de API é rápida, isolada e reproduzível. A maior parte das verificações está nela.
- O E2E depende do ambiente público. Para reduzir o impacto:
  - teardown tolerante a registros apagados por terceiros ([ADR-0003](0003-cada-teste-e-dono-dos-proprios-dados.md));
  - 1 retry no CI, com o teste marcado como *flaky* no relatório, em vez de esconder a instabilidade;
  - timeout de asserção de 10 segundos, **medido**: o cadastro leva de 4 a 5,5 segundos até redirecionar nesse ambiente.
- Se surgir uma forma de rodar o front localmente, este ADR deve ser revisto.
