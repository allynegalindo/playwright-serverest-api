# ADR-0004: Validação de contrato com JSON Schema

- **Status:** Aceito
- **Data:** 21/10/2026

## Contexto

Verificar só alguns campos da resposta (`toMatchObject`) não detecta mudanças de formato: um campo novo, um tipo trocado (número que vira texto) ou um formato diferente de id. Essas mudanças quebram quem consome a API, como o front.

## Decisão

Validar as respostas contra **JSON Schema** (pasta `schemas/`), com o Ajv e um matcher próprio, `toMatchSchema`. Os schemas usam `additionalProperties: false`, então um campo novo na resposta falha o teste de propósito.

## Alternativas consideradas

- **Só `toMatchObject` ou `toEqual`:** continuam sendo usados para conferir **valores**, mas não descrevem tipos, formatos e campos permitidos.
- **Pact (contrato guiado pelo consumidor):** mais completo quando existem times diferentes para front e API, mas exige um broker e a participação do provedor. Não se justifica para um sistema de terceiros como a ServeRest.
- **Schema gerado a partir do Swagger:** reduz o trabalho manual, mas o Swagger da ServeRest não descreve tudo o que a API realmente devolve. O schema escrito à mão documenta o comportamento real.

## Consequências

- Mudanças de contrato são percebidas no primeiro teste que roda.
- A mensagem de falha do matcher mostra exatamente qual campo violou o schema.
- Os schemas precisam ser atualizados quando o contrato muda de forma intencional. É uma revisão consciente, não um efeito colateral.
