# ADR-0007: Bugs conhecidos documentados com `test.fail`

- **Status:** Aceito
- **Data:** 21/10/2026

## Contexto

Os testes de contrato revelaram que a API devolve a senha dos usuários ([BUG-001](../bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md)). O defeito não depende do time de QA para ser corrigido. Era preciso decidir o que fazer com o teste que o detecta.

## Decisão

Manter o teste que descreve o comportamento **correto** e marcá-lo com `test.fail`, com a anotação `{ type: 'bug', description: ... }`.

- Enquanto o bug existir, o teste falha como esperado, e o pipeline continua verde.
- Quando o bug for corrigido, o teste passa, o Playwright acusa "passou, mas era esperado falhar", e a marcação é removida.

## Alternativas consideradas

- **Deixar o teste falhando:** o pipeline fica vermelho o tempo todo, o time se acostuma e para de olhar, e falhas novas passam despercebidas.
- **`test.skip`:** o teste para de rodar. Ninguém fica sabendo quando o bug for corrigido, e o defeito tende a ser esquecido.
- **Apagar o teste e registrar só no Jira:** o conhecimento sai do código e a verificação automática se perde.
- **Escrever o teste esperando o comportamento errado:** a suíte passaria a garantir o bug, o que é o oposto do objetivo.

## Consequências

- O defeito fica documentado no código, visível no relatório e ligado ao bug report.
- A correção é detectada automaticamente.
- Exige critério: `test.fail` é para defeitos confirmados e registrados, nunca para esconder testes instáveis.
