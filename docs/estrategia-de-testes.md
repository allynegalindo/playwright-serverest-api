# Estratégia de testes: ServeRest

| | |
| --- | --- |
| **Responsável** | Allyne Galindo |
| **Última revisão** | 21/10/2026 |
| **Sistema testado** | [ServeRest](https://serverest.dev): API REST de uma loja virtual e o [front](https://front.serverest.dev) que a consome |

Este documento explica **o que** é testado, **por que** e **como**. As decisões técnicas por trás da automação estão nos [ADRs](adr/README.md).

## 1. Objetivo

Dar confiança de que as funcionalidades principais da loja (cadastro, login e gestão de produtos) funcionam como esperado e continuam funcionando a cada mudança, com uma suíte:

- **rápida**, para rodar em todo pull request;
- **confiável**, sem falhas aleatórias que façam o time ignorar o resultado;
- **independente**, sem depender de dados que já existam na base.

## 2. Escopo

### Dentro do escopo

| Funcionalidade | API | Interface |
| --- | --- | --- |
| Cadastro de usuários | ✅ | ✅ |
| Login | ✅ | ✅ |
| Cadastro, edição e exclusão de produtos | ✅ | ✅ (cadastro e exclusão) |
| Autorização por perfil (administrador e cliente) | ✅ | ✅ (indireta: o perfil define a tela de destino) |

### Fora do escopo, por enquanto

| Item | Motivo | Próximo passo |
| --- | --- | --- |
| **Carrinho e compra** | Exige estoque e regras de concorrência. Merece uma rodada própria de análise de risco | Planejado: maior risco ainda descoberto (ver seção 3) |
| **Performance** | Precisa de ambiente controlado: medir carga no ambiente público seria impreciso e prejudicaria outras pessoas | Planejado: k6 contra a ServeRest local |
| **Segurança** | Fora do foco funcional. Achados de segurança aparecem como consequência dos testes funcionais (ver [BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md)) | - |
| **Acessibilidade e compatibilidade entre navegadores** | O front é uma aplicação de demonstração. O E2E roda só no Chromium | - |

## 3. Análise de risco

Os riscos foram priorizados por **impacto × probabilidade**. A prioridade define a ordem em que a cobertura foi construída e o nível de teste usado.

| # | Risco | Impacto | Prob. | Prioridade | Como é coberto |
| --- | --- | --- | --- | --- | --- |
| R1 | Usuário comum ou sem login acessar rotas de administrador | Alto | Média | **Alta** | API: 403 para cliente, 401 sem token e com token inválido |
| R2 | API mudar o formato da resposta e quebrar o front | Alto | Média | **Alta** | API: contrato com JSON Schema e `additionalProperties: false` |
| R3 | Dados sensíveis expostos pela API | Alto | Média | **Alta** | API: teste específico. **Risco confirmado**, ver [BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md) |
| R4 | Login falhar pela tela | Alto | Baixa | **Alta** | E2E: login de administrador, de cliente e com senha errada |
| R5 | Produto salvo com preço ou quantidade inválidos | Médio | Média | **Média** | API: análise de valor limite |
| R6 | Cadastro duplicado (e-mail ou nome de produto) | Médio | Média | **Média** | API: e-mail e nome repetidos |
| R7 | Tela mostrar sucesso sem o dado ter sido salvo | Médio | Baixa | **Média** | E2E: todo cadastro feito pela tela é conferido na API |
| R8 | Carrinho com estoque negativo ou compra concorrente | Alto | Média | **Alta** | **Não coberto.** Fora do escopo atual (seção 2) |

O R8 está registrado de propósito: o risco existe, foi avaliado e tem prioridade alta. Deixar a lacuna visível é o que garante que ela seja tratada.

## 4. Níveis de teste

A suíte segue a pirâmide de testes: o máximo de verificações na API, onde o teste é rápido e estável, e na interface só o que depende dela.

```
             ┌──────────────────────┐
             │     Exploratório     │  sessões guiadas por charters (seção 11)
             ├──────────────────────┤
             │    E2E com BDD (8)   │  fluxos que dependem da tela
         ┌───┴──────────────────────┴───┐
         │           API (24)           │  regras, contratos, validações, autorização
         └──────────────────────────────┘
```

| Nível | O que verifica | O que **não** verifica |
| --- | --- | --- |
| **API** | Regras de negócio, contrato, validações, autorização, códigos de status e mensagens | Comportamento da tela |
| **E2E** | Fluxos principais pela tela: navegação, redirecionamentos, alertas e integração front + API | Variações de regra já cobertas na API, como os valores limite |
| **Exploratório** | O que ninguém pensou em escrever: combinações inesperadas, usabilidade, inconsistências entre camadas | - |

**Exemplo da divisão:** a regra "preço precisa ser inteiro maior que zero" tem 3 casos na API (`0`, `1` e `1,5`). No E2E, existe só o cenário de cadastro válido e o de formulário vazio. Repetir os valores limite pela tela deixaria a suíte mais lenta sem aumentar a confiança.

## 5. Técnicas de teste

| Técnica | Onde é aplicada |
| --- | --- |
| **Particionamento de equivalência** | Login: credenciais válidas, senha errada e campos ausentes |
| **Análise de valor limite** | Preço (inteiro ≥ 1) e quantidade (inteiro ≥ 0): testa o menor valor aceito, o primeiro recusado e o não inteiro |
| **Tabela de decisão** | Autorização: perfil × situação do token → resultado esperado |
| **Testes orientados a dados** | Formatos inválidos, valores limite e tokens inválidos: uma lista de casos executada pelo mesmo teste |
| **BDD** | Cenários E2E em Gherkin, revisáveis por quem não programa |
| **Teste de contrato** | Respostas validadas contra JSON Schema |
| **Teste exploratório** | Sessões com charter, tempo definido e registro dos achados |

Tabela de decisão usada na autorização de `POST /produtos`:

| Perfil | Token | Resultado esperado |
| --- | --- | --- |
| Administrador | Válido | 201 Criado |
| Cliente | Válido | 403 "Rota exclusiva para administradores" |
| - | Ausente | 401 "Token de acesso ausente, inválido..." |
| - | Malformado | 401 "Token de acesso ausente, inválido..." |

## 6. Dados de teste

**Regra:** cada teste cria os dados de que precisa e os apaga ao final, mesmo se falhar ([ADR-0003](adr/0003-cada-teste-e-dono-dos-proprios-dados.md)).

- **Criação:** sempre pela API, que é mais rápida e estável do que pela tela.
- **Identificação:** e-mails `qa.auto-<8 caracteres>@teste.com` e produtos `auto-produto-<8 caracteres>`, únicos e fáceis de achar numa limpeza manual.
- **Dados cadastrados pela tela:** o nome ou e-mail é reservado antes, e o teardown apaga pela API.
- **Testes negativos:** se a API aceitar por engano algo que deveria recusar, o registro criado ainda é apagado.
- **Proibido:** usar ou alterar dados que o teste não criou.

## 7. Ambientes

| Suíte | Ambiente | Motivo |
| --- | --- | --- |
| API | ServeRest local, iniciada pelo próprio Playwright | Isolado, rápido e reproduzível |
| E2E | Front e API públicos | O front público só conversa com a API pública |

Detalhes e consequências em [ADR-0008](adr/0008-api-local-e-e2e-no-ambiente-publico.md).

## 8. Critérios de entrada e saída

### Para um pull request ser mesclado

- [ ] Lint sem erros
- [ ] Todos os testes passando: a falha esperada de um bug conhecido conta como aprovada
- [ ] Nenhum teste novo marcado como *flaky* no relatório
- [ ] Nenhum `test.only` esquecido (o pipeline bloqueia)
- [ ] Cenário novo acompanhado da limpeza dos dados que ele cria

### Para considerar uma funcionalidade testada

- [ ] Riscos da funcionalidade avaliados e registrados na seção 3
- [ ] Caminho principal coberto e marcado como `@smoke`
- [ ] Regras de negócio cobertas na API, incluindo os casos de erro
- [ ] Fluxo principal coberto no E2E, quando depende da interface
- [ ] Pelo menos uma sessão exploratória registrada

## 9. Gestão de defeitos

### Severidade

| Severidade | Definição | Exemplo |
| --- | --- | --- |
| **Crítica** | Impede o uso do sistema ou expõe dados sensíveis | Senha visível para qualquer pessoa ([BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md)) |
| **Alta** | Uma funcionalidade principal não funciona e não há alternativa | Não é possível cadastrar produtos |
| **Média** | A funcionalidade funciona com falhas ou existe alternativa | Mensagem de erro errada |
| **Baixa** | Problema visual ou de texto, sem impacto no uso | Erro de digitação na tela |

### Bug report

Todo defeito é registrado com título objetivo, severidade, ambiente, passos de reprodução, resultado esperado, resultado obtido e evidências. Modelo de referência: [BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md).

### Bugs conhecidos na suíte

Um bug conhecido vira um teste com `test.fail` e a anotação `bug` ([ADR-0007](adr/0007-bugs-conhecidos-com-test-fail.md)). O pipeline continua verde, o defeito continua visível e o teste avisa quando a correção chegar.

## 10. Métricas acompanhadas

| Métrica | Onde ver | Por que importa |
| --- | --- | --- |
| Taxa de aprovação | Relatório HTML e resumo do PR | Saúde da suíte |
| Testes *flaky* | Relatório HTML (passaram só no retry) | Teste instável faz o time ignorar falhas reais |
| Duração da suíte | GitHub Actions | Suíte lenta deixa de rodar em todo PR |
| Bugs por severidade | Pasta [`bugs/`](bugs/) | Onde estão os maiores riscos do sistema |

## 11. Testes exploratórios

Sessões curtas (30 a 60 minutos), guiadas por um **charter**: *explorar [área] com [recursos] para descobrir [tipo de informação]*.

### Sessão 1: cadastro de produto entre front e API

- **Charter:** explorar o cadastro de produto pela tela, observando as requisições, para descobrir diferenças entre o que o front envia e o que a API valida.
- **Achados:**
  - O front envia `preco` e `quantidade` como **texto** (`"123"`), e a API aceita e converte para número. Isso explica por que a API também aceita texto quando chamada diretamente. Não foi registrado como bug, porque pode ser uma decisão de projeto. Fica como ponto a alinhar com o time.
  - O front não valida os campos antes de enviar: os alertas de campo obrigatório vêm da API.

### Sessão 2: cadastro de usuário pela tela

- **Charter:** explorar o fluxo de cadastro pela tela, medindo os tempos de rede, para descobrir o que acontece entre o clique em "Cadastrar" e a entrada na loja.
- **Achados:**
  - Depois do cadastro, o front faz login sozinho e redireciona para a loja. O alerta de sucesso some no redirecionamento.
  - O redirecionamento leva de **4 a 5,5 segundos**. A maior parte desse tempo é um `GET /usuarios` que baixa **a lista inteira de usuários** do ambiente, um problema de performance que cresce junto com a base.
  - Consequência na automação: o cenário verifica a entrada na loja, não o alerta passageiro, e o timeout do E2E foi ajustado com base nessa medição.

### Próxima sessão planejada

- **Charter:** explorar o carrinho com estoque no limite (0 e 1 unidade) e duas sessões ao mesmo tempo, para descobrir problemas de estoque negativo e concorrência (risco R8).

## 12. Rastreabilidade

Regras de negócio extraídas da [documentação da API](https://serverest.dev) e do comportamento observado, ligadas aos testes que as cobrem.

| Regra | Teste de API | Cenário E2E |
| --- | --- | --- |
| RN01: o e-mail do usuário é único | `não aceita e-mail já cadastrado` | `E-mail já cadastrado` |
| RN02: o nome do produto é único | `não aceita nome repetido` | - |
| RN03: só administradores cadastram produtos | `usuário comum não cadastra produto` | - |
| RN04: rotas protegidas exigem token válido | `recusa cadastro sem token` e `com token malformado` | - |
| RN05: preço é inteiro ≥ 1 e quantidade é inteiro ≥ 0 | `Valores limite de preço e quantidade` (6 casos) | - |
| RN06: login exige e-mail e senha corretos | `recusa senha errada`, `exige e-mail e senha` | `Senha errada não permite o acesso` |
| RN07: o perfil define a tela inicial após o login | - | `Administrador é levado ao painel`, `Cliente é levado à vitrine` |
| RN08: dados obrigatórios do cadastro | `informa todos os campos obrigatórios de uma vez` | `Formulário vazio informa todos os campos obrigatórios` |
| RN09: a senha não deve ser exposta | `não expõe a senha na listagem de usuários` ([BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md)) | - |

## 13. Riscos da própria estratégia

| Risco | Mitigação |
| --- | --- |
| Ambiente público lento ou alterado por outras pessoas | Retry único no CI com relatório de *flaky*, teardown tolerante e limitação documentada no README |
| Execução interrompida deixa dados para trás | Prefixos padronizados permitem limpeza manual |
| Testes de interface ficarem frágeis com mudanças de layout | Seletores por `data-testid` e papel acessível, nunca por classe CSS ou posição |
