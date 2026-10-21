# ADR-0001: Registrar decisões técnicas em ADRs

- **Status:** Aceito
- **Data:** 21/10/2026

## Contexto

O projeto acumulou decisões que não são óbvias olhando só o código: por que o teardown aceita registros já apagados, por que o login do E2E não passa pela tela, por que um teste com bug conhecido fica verde. Sem registro, essas decisões se perdem, e alguém pode "corrigir" algo que foi feito de propósito.

## Decisão

Toda decisão técnica com alternativas reais e consequências relevantes é registrada em um ADR na pasta `docs/adr`, seguindo o modelo do [índice](README.md).

## Alternativas consideradas

- **Comentários no código:** bons para explicar uma linha, ruins para explicar uma decisão que envolve várias partes do projeto. Continuam sendo usados para o detalhe local.
- **Só o README:** ficaria longo demais e misturaria "como usar" com "por que é assim".
- **Wiki externa:** fica longe do código e desatualiza sem ninguém perceber.

## Consequências

- Decisões ficam revisáveis no mesmo pull request que as implementa.
- Quem chega ao projeto entende o raciocínio, não só o resultado.
- Exige disciplina: uma decisão nova sem ADR é uma pendência de revisão.
