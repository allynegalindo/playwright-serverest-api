# ADR-0005: BDD com playwright-bdd em vez de Cucumber.js

- **Status:** Aceito
- **Data:** 21/10/2026

## Contexto

Os cenários E2E precisam ser legíveis por quem não programa (PO, designers, outras pessoas de QA), para alinhar o comportamento esperado antes e depois do desenvolvimento. Ao mesmo tempo, o projeto já usa o runner do Playwright ([ADR-0002](0002-playwright-como-runner-unico.md)).

## Decisão

Escrever os cenários E2E em **Gherkin, em português**, e executá-los com o **playwright-bdd**, que converte cada cenário em um teste nativo do Playwright.

A organização segue uma responsabilidade por camada:

- **features:** comportamento, em linguagem de negócio;
- **steps:** ligam as frases às páginas e às verificações, sem seletores;
- **Page Objects:** localizadores e ações, sem asserções;
- **fixtures:** páginas, dados e limpeza.

## Alternativas consideradas

- **Cucumber.js com Playwright como biblioteca:** é o caminho mais conhecido, mas perde o runner do Playwright: fixtures, paralelismo nativo, retries, trace e o relatório HTML teriam de ser montados à mão.
- **Testes E2E sem BDD:** mais simples, mas perde o documento vivo que o time inteiro consegue ler e revisar.
- **Gherkin em inglês:** o time e o produto são brasileiros. Português deixa os cenários acessíveis a todos.

## Consequências

- Os cenários servem ao mesmo tempo de documentação e de teste.
- O E2E aproveita todo o ecossistema do Playwright e as fixtures de dados da API.
- Os testes são gerados por um passo a mais (`bddgen`), que já está incluído nos scripts do `package.json`.
- Frases de steps precisam ser reutilizáveis e consistentes. Isso pede revisão para não virar uma coleção de frases parecidas.
