# ADR-0002: Playwright como runner único para API e E2E

- **Status:** Aceito
- **Data:** 20/10/2026

## Contexto

O projeto testa a mesma aplicação em duas camadas, API e interface. As duas precisam compartilhar a criação de dados (usuários, produtos e login) e gerar um relatório único no pipeline.

## Decisão

Usar o **Playwright Test** para as duas camadas: o `request` para a API e o navegador para o E2E, no mesmo `playwright.config.js`, separados em dois projetos (`api` e `e2e`).

## Alternativas consideradas

- **Cypress:** ótimo para E2E, mas as fixtures do Playwright são mais flexíveis para setup e teardown com dependências entre si, e o paralelismo é nativo e gratuito.
- **Jest + supertest para a API e outra ferramenta para o E2E:** dois runners, duas configurações e dois relatórios, e os clients de API não seriam reaproveitados no E2E com a mesma facilidade.
- **Postman + Newman:** bom para exploração e testes simples, mas fica limitado para fixtures com teardown garantido, factories e validação de contrato versionada junto do código.

## Consequências

- Clients, factories e fixtures de dados são escritos uma vez e usados pelas duas camadas.
- Um relatório HTML só, com API e E2E juntos.
- O time precisa conhecer uma ferramenta só.
- Em troca, o projeto fica preso ao ecossistema do Playwright, o que é aceitável pelo uso amplo e pela manutenção ativa da ferramenta.
