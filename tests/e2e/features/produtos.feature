# language: pt
@produtos
Funcionalidade: Gestão de produtos
  Como administrador da loja
  Quero cadastrar e excluir produtos
  Para manter o catálogo atualizado

  Contexto:
    Dado que tenho uma sessão de administrador

  @smoke
  Cenário: Cadastrar produto
    Quando cadastro um novo produto
    Então o produto aparece na lista de produtos
    E o produto fica salvo na API com os dados informados

  Cenário: Excluir produto
    Dado que existe um produto cadastrado
    Quando excluo o produto na lista de produtos
    Então o produto não aparece mais na lista
    E o produto não existe mais na API

  Cenário: Formulário vazio informa todos os campos obrigatórios
    Quando tento cadastrar um produto sem preencher os campos
    Então vejo os alertas:
      | Nome é obrigatório       |
      | Preco é obrigatório      |
      | Descricao é obrigatório  |
      | Quantidade é obrigatório |
