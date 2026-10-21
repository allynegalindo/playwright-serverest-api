# Estratégia de testes: ServeRest

| | |
| --- | --- |
| **Responsável** | Allyne Galindo |
| **Última revisão** | 21/10/2026 |
| **Sistema testado** | [ServeRest](https://serverest.dev): API REST de uma loja virtual e o [front](https://front.serverest.dev) que a consome |

## 1. Escopo

### Dentro do escopo

| Funcionalidade | API | Interface |
| --- | --- | --- |
| Cadastro de usuários | ✅ | ✅ |
| Login | ✅ | ✅ |
| Cadastro, edição e exclusão de produtos | ✅ | ✅ (cadastro e exclusão) |
| Autorização por perfil (administrador e cliente) | ✅ | ✅ (o perfil define a tela de destino) |

### Fora do escopo, por enquanto

| Item | Motivo |
| --- | --- |
| **Carrinho e compra** | Envolve estoque e concorrência. Merece uma análise própria antes de ser automatizado |
| **Performance** | Precisa de um ambiente controlado. Medir carga no ambiente público seria impreciso |
| **Acessibilidade e outros navegadores** | O E2E roda só no Chromium |

## 2. Pirâmide de testes

O máximo de verificações fica na API, onde o teste é rápido e estável. Na interface fica só o que depende dela.

```
         ┌──────────────────────┐
         │    E2E com BDD (8)   │  fluxos que dependem da tela
     ┌───┴──────────────────────┴───┐
     │           API (24)           │  regras, contratos, validações, autorização
     └──────────────────────────────┘
```

| Nível | O que verifica | O que **não** verifica |
| --- | --- | --- |
| **API** | Regras de negócio, contrato, validações, autorização, códigos de status e mensagens | Comportamento da tela |
| **E2E** | Fluxos principais pela tela: navegação, redirecionamentos, alertas e a integração entre front e API | Variações de regra já cobertas na API |

**Exemplo:** a regra "preço precisa ser inteiro maior que zero" tem 3 casos na API (`0`, `1` e `1,5`). Repetir esses casos pela tela deixaria a suíte mais lenta sem aumentar a confiança.

## 3. Técnicas de teste

| Técnica | Onde é aplicada |
| --- | --- |
| **Particionamento de equivalência** | Login: credenciais válidas, senha errada e campos ausentes |
| **Análise de valor limite** | Preço (inteiro ≥ 1) e quantidade (inteiro ≥ 0): o menor valor aceito, o primeiro recusado e o não inteiro |
| **Tabela de decisão** | Autorização: perfil × situação do token → resultado esperado |
| **Testes orientados a dados** | Formatos inválidos, valores limite e tokens inválidos: uma lista de casos executada pelo mesmo teste |
| **BDD** | Cenários E2E em Gherkin, revisáveis por quem não programa |
| **Teste de contrato** | Respostas da API validadas contra JSON Schema |

Tabela de decisão da autorização em `POST /produtos`:

| Perfil | Token | Resultado esperado |
| --- | --- | --- |
| Administrador | Válido | 201 Criado |
| Cliente | Válido | 403 "Rota exclusiva para administradores" |
| - | Ausente | 401 "Token de acesso ausente, inválido..." |
| - | Malformado | 401 "Token de acesso ausente, inválido..." |

## 4. Gestão de defeitos

### Severidade

| Severidade | Definição | Exemplo |
| --- | --- | --- |
| **Crítica** | Impede o uso do sistema ou expõe dados sensíveis | Senha visível para qualquer pessoa ([BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md)) |
| **Alta** | Uma funcionalidade principal não funciona e não há alternativa | Não é possível cadastrar produtos |
| **Média** | A funcionalidade funciona com falhas ou existe alternativa | Mensagem de erro errada |
| **Baixa** | Problema visual ou de texto, sem impacto no uso | Erro de digitação na tela |

### Registro

Todo defeito é registrado com título objetivo, severidade, ambiente, passos de reprodução, resultado esperado, resultado obtido e evidências. Modelo: [BUG-001](bugs/BUG-001-senha-exposta-na-listagem-de-usuarios.md).

### Bugs conhecidos na suíte

Um bug conhecido vira um teste com `test.fail` e a anotação `bug`. O pipeline continua verde, o defeito continua visível no relatório e o teste avisa quando a correção chegar.

## 5. Rastreabilidade

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
