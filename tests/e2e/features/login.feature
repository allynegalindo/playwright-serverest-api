# language: pt
@login
Funcionalidade: Login
  Como pessoa cadastrada na loja
  Quero entrar com meu e-mail e senha
  Para acessar as funcionalidades do meu perfil

  @smoke
  Cenário: Administrador é levado ao painel administrativo
    Dado que existe um administrador cadastrado
    Quando faço login com as credenciais dele
    Então vejo o painel administrativo com as boas-vindas para ele

  Cenário: Cliente é levado à vitrine da loja
    Dado que existe um cliente cadastrado
    Quando faço login com as credenciais dele
    Então vejo a vitrine da loja

  Cenário: Senha errada não permite o acesso
    Dado que existe um cliente cadastrado
    Quando faço login com uma senha errada
    Então vejo o alerta "Email e/ou senha inválidos"
