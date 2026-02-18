export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

  // Se a rota é pública, permite acesso
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Se não está logado, redireciona para login
  if (!user.value) {
    return navigateTo('/login')
  }

  // Se já está no onboarding, permite acesso
  if (to.path === '/onboarding') {
    return
  }

  // Verificar se o usuário tem pelo menos uma empresa
  const { empresas, empresaAtiva, getEmpresas, carregarEmpresaAtiva } = useEmpresa()

  // Se a lista ainda não foi carregada, carregar
  if (empresas.value.length === 0) {
    try {
      const lista = await getEmpresas()
      if (lista.length === 0) {
        return navigateTo('/onboarding')
      }
    } catch {
      // Em caso de erro (ex: tabelas ainda não existem), permite acesso
      return
    }
  }

  // Garantir que a empresa ativa esteja carregada antes de renderizar a página
  if (!empresaAtiva.value) {
    await carregarEmpresaAtiva()
  }
})
