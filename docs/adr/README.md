# Registro de decisões (ADRs)

Um ADR (*Architecture Decision Record*) registra **uma** decisão técnica importante: o contexto em que foi tomada, as alternativas consideradas e as consequências, inclusive as negativas.

O objetivo é que qualquer pessoa entenda **por que** o projeto é como é, sem depender de quem tomou a decisão estar por perto. Quando uma decisão muda, o ADR antigo não é apagado: ele é marcado como "Substituído" e um novo é criado.

| # | Decisão | Status |
| --- | --- | --- |
| [0001](0001-registrar-decisoes-em-adrs.md) | Registrar decisões técnicas em ADRs | Aceito |
| [0002](0002-playwright-como-runner-unico.md) | Playwright como runner único para API e E2E | Aceito |
| [0003](0003-cada-teste-e-dono-dos-proprios-dados.md) | Cada teste é dono dos próprios dados | Aceito |
| [0004](0004-contrato-com-json-schema.md) | Validação de contrato com JSON Schema | Aceito |
| [0005](0005-bdd-com-playwright-bdd.md) | BDD com playwright-bdd em vez de Cucumber.js | Aceito |
| [0006](0006-login-pela-api-nos-cenarios-e2e.md) | Login pela API nos cenários E2E | Aceito |
| [0007](0007-bugs-conhecidos-com-test-fail.md) | Bugs conhecidos documentados com `test.fail` | Aceito |
| [0008](0008-api-local-e-e2e-no-ambiente-publico.md) | API testada localmente e E2E no ambiente público | Aceito |

## Modelo

```markdown
# ADR-XXXX: Título da decisão

- **Status:** Proposto | Aceito | Substituído por ADR-YYYY
- **Data:** DD/MM/AAAA

## Contexto
Qual problema ou necessidade levou à decisão.

## Decisão
O que foi decidido.

## Alternativas consideradas
Outras opções e por que não foram escolhidas.

## Consequências
O que melhora, o que piora e o que passa a ser necessário.
```
