# language: pt
@usuarios
Funcionalidade: Cadastro de usuário
  Como visitante da loja
  Quero criar minha conta
  Para poder fazer compras

  @smoke
  Cenário: Cadastro com dados válidos
    Quando me cadastro com dados válidos
    Então vejo a vitrine da loja
    E minha conta fica salva na API como cliente

  Cenário: E-mail já cadastrado
    Dado que existe um cliente cadastrado
    Quando tento me cadastrar com o e-mail dele
    Então vejo o alerta "Este email já está sendo usado"
