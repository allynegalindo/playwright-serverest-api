// O front guarda a sessão no localStorage. Preencher essas chaves antes de a página
// carregar equivale a ter feito login, sem gastar tempo passando pela tela.
// Só o cenário de login testa o login de verdade.
export async function iniciarSessao(page, { nome, email, token }) {
  await page.addInitScript(
    ([nome, email, token]) => {
      localStorage.setItem('serverest/userNome', nome);
      localStorage.setItem('serverest/userEmail', email);
      localStorage.setItem('serverest/userToken', token);
    },
    [nome, email, token],
  );
}
