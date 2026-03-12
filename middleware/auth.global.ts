export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

  // Se a rota é pública, permite acesso
  if (publicRoutes.includes(to.path)) {
    return
  }

  // Rotas de contagem pública (acessadas via token, sem login)
  if (to.path.startsWith('/contagem/')) {
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

  // =============================================
  // Check de assinatura / billing
  // =============================================

  // Rotas isentas de check de billing
  const billingExemptRoutes = [
    '/assinatura',
    '/assinatura/sucesso',
    '/assinatura/cancelado',
  ]

  const isBillingExempt = billingExemptRoutes.some(r => to.path === r)
  const isAdminRoute = to.path.startsWith('/admin')

  // Admin e rotas de billing não precisam de check
  if (isBillingExempt || isAdminRoute) {
    return
  }

  // Carregar assinatura se ainda não carregada
  const { carregarAssinatura, isBlocked, loaded } = useAssinatura()

  if (!loaded.value) {
    await carregarAssinatura()
  }

  // Se bloqueado, redirecionar para página de assinatura
  if (isBlocked.value) {
    return navigateTo('/assinatura')
  }
})
