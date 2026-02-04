export default defineNuxtRouteMiddleware((to) => {
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
})
