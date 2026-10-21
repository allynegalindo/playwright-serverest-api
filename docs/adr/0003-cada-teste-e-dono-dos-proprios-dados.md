# ADR-0003: Cada teste é dono dos próprios dados

- **Status:** Aceito
- **Data:** 20/10/2026, revisado em 21/10/2026 com o teardown tolerante

## Contexto

Testes que usam dados já existentes na base ("pega o primeiro usuário da lista") ficam frágeis, alteram dados de outras pessoas, deixam lixo e não podem rodar em paralelo. No ambiente público da ServeRest, compartilhado com outras pessoas, esse problema é ainda maior.

## Decisão

1. Cada teste **cria pela API** os dados de que precisa, por meio de fixtures, e **apaga ao final**, mesmo se falhar.
2. Os dados têm valores únicos e identificáveis, gerados por factories (`qa.auto-*`, `auto-produto-*`).
3. Os clients **guardam todo registro criado** (status 201) e a fixture apaga o que sobrar. Assim, um teste negativo que cria algo por engano não deixa lixo.
4. Dados cadastrados **pela tela** têm o nome ou e-mail reservado por uma fixture, que apaga pela API ao final.
5. O teardown usa `discard()`, que **aceita o registro já apagado**. O `remove()`, que exige a mensagem de exclusão, fica para os testes que verificam a exclusão.

## Alternativas consideradas

- **Massa de dados fixa (seed):** simples, mas os testes passam a depender uns dos outros e da ordem de execução, e qualquer alteração na base quebra a suíte.
- **Limpar a base inteira antes de cada execução:** impossível num ambiente compartilhado e perigoso em qualquer ambiente que não seja descartável.
- **`try/finally` em cada teste:** funciona, mas repete o mesmo código em todos os testes. As fixtures escrevem o ciclo uma vez só.
- **Teardown estrito:** a primeira versão usava `remove()` também no teardown. Na prática, quando o próprio cenário apagava o registro, ou quando outra pessoa o apagava no ambiente público, o teste falhava por algo que ele não estava verificando.

## Consequências

- A suíte roda com `fullyParallel: true` sem conflitos.
- Os testes não dependem da ordem nem do estado da base.
- Cada teste faz algumas requisições a mais de setup e teardown, um custo pequeno perto da estabilidade que se ganha.
- Se o processo for interrompido à força, o teardown não roda. Os prefixos padronizados permitem uma limpeza manual.
