# ADR-0006: Login pela API nos cenários E2E

- **Status:** Aceito
- **Data:** 21/10/2026

## Contexto

Quase todos os cenários E2E precisam de um usuário logado. Fazer login pela tela em cada um deles deixa a suíte mais lenta e faz qualquer problema na tela de login derrubar cenários que não têm nada a ver com login.

O front guarda a sessão no `localStorage` (`serverest/userToken`, `serverest/userNome` e `serverest/userEmail`).

## Decisão

O passo `Dado que tenho uma sessão de administrador` cria o usuário e faz login **pela API**, e grava o token no `localStorage` do navegador antes de a página abrir (`tests/e2e/support/sessao.js`).

O login pela tela continua coberto, na funcionalidade `Login`.

## Alternativas consideradas

- **Login pela tela em todo cenário:** mais lento e acopla todos os cenários à tela de login.
- **`storageState` salvo uma vez em um setup global:** é o padrão da documentação do Playwright, mas faria todos os cenários compartilharem o mesmo usuário, contrariando o [ADR-0003](0003-cada-teste-e-dono-dos-proprios-dados.md) e o paralelismo. Além disso, o token da ServeRest expira em 10 minutos.

## Consequências

- Cada cenário testa só o que se propõe a testar.
- Cada cenário tem o próprio usuário, então o paralelismo continua seguro.
- O teste conhece um detalhe de implementação do front: as chaves do `localStorage`. Se o front mudar a forma de guardar a sessão, só o arquivo `sessao.js` precisa mudar, e o cenário de login pela tela continua garantindo que o fluxo real funciona.
