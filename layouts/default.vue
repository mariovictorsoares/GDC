<template>
  <div class="min-h-screen bg-operacao-200">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <div class="flex flex-col h-full">
        <!-- Logo com fundo branco -->
        <div class="flex items-center justify-center h-16 border-b border-gray-200 bg-white px-4">
          <img src="/logo-guardiao.png" alt="Guardião do CMV" class="h-10 w-auto object-contain" />
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto p-4">
          <div class="space-y-1">
            <!-- Dashboard -->
            <NuxtLink
              to="/"
              class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="isActive('/') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              <UIcon name="i-heroicons-home" class="w-5 h-5" />
              Dashboard
            </NuxtLink>

            <!-- Cadastros -->
            <div class="pt-4">
              <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cadastros</p>
              <div class="mt-2 space-y-1">
                <NuxtLink
                  to="/cadastro/produtos"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/cadastro/produtos') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-cube" class="w-5 h-5" />
                  Produtos
                </NuxtLink>
                <NuxtLink
                  to="/cadastro/grupos"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/cadastro/grupos') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-folder" class="w-5 h-5" />
                  Grupos / Subgrupos
                </NuxtLink>
                <NuxtLink
                  to="/cadastro/destinos"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/cadastro/destinos') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-arrow-right-circle" class="w-5 h-5" />
                  Tipos de Saída
                </NuxtLink>
              </div>
            </div>

            <!-- Controle de Estoque -->
            <div class="pt-4">
              <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Controle de Estoque</p>
              <div class="mt-2 space-y-1">
                <NuxtLink
                  to="/movimentos/entradas"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/movimentos/entradas') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-controle-500" />
                  Entradas
                </NuxtLink>
                <NuxtLink
                  to="/movimentos/saidas"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/movimentos/saidas') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-5 h-5 text-red-500" />
                  Saídas
                </NuxtLink>
                <NuxtLink
                  to="/movimentos/ajustes"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/movimentos/ajustes') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-adjustments-horizontal" class="w-5 h-5 text-alerta-500" />
                  Ajustes
                </NuxtLink>
              </div>
            </div>

            <!-- Relatórios -->
            <div class="pt-4">
              <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Relatórios</p>
              <div class="mt-2 space-y-1">
                <NuxtLink
                  to="/relatorios/painel-mes"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/relatorios/painel-mes') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
                  Painel Mês
                </NuxtLink>
                <NuxtLink
                  to="/relatorios/curva-abc"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/relatorios/curva-abc') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-chart-bar" class="w-5 h-5" />
                  Curva ABC
                </NuxtLink>
                <NuxtLink
                  to="/relatorios/estoque-minimo"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/relatorios/estoque-minimo') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5" />
                  Estoque Mínimo
                </NuxtLink>
                <NuxtLink
                  to="/relatorios/giro-estoque"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/relatorios/giro-estoque') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" />
                  Giro de Estoque
                </NuxtLink>
                <NuxtLink
                  to="/relatorios/cmv"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/relatorios/cmv') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-currency-dollar" class="w-5 h-5" />
                  CMV
                </NuxtLink>
                <NuxtLink
                  to="/relatorios/variacao-custo"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/relatorios/variacao-custo') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-chart-bar-square" class="w-5 h-5" />
                  Variação de Custo
                </NuxtLink>
              </div>
            </div>

            <!-- Configuracoes -->
            <div class="pt-4">
              <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Configurações</p>
              <div class="mt-2 space-y-1">
                <NuxtLink
                  to="/configuracoes/empresa"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/configuracoes/empresa') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-building-office" class="w-5 h-5" />
                  Empresa
                </NuxtLink>
                <NuxtLink
                  to="/configuracoes/faturamentos"
                  class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                  :class="isActive('/configuracoes/faturamentos') ? 'bg-guardian-50 text-guardian-700' : 'text-gray-700 hover:bg-gray-100'"
                >
                  <UIcon name="i-heroicons-banknotes" class="w-5 h-5" />
                  Faturamentos
                </NuxtLink>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </aside>

    <!-- Mobile sidebar overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div class="flex items-center justify-between h-16 px-4">
          <!-- Mobile menu button -->
          <button
            class="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            @click="sidebarOpen = !sidebarOpen"
          >
            <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
          </button>

          <!-- Saudação -->
          <h2 class="text-lg font-semibold text-operacao-950 hidden lg:block">
            {{ greeting }}
          </h2>

          <!-- Right side -->
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-500">{{ currentDate }}</span>
            <UButton
              v-if="user"
              color="gray"
              variant="ghost"
              icon="i-heroicons-arrow-right-on-rectangle"
              @click="logout"
            >
              Sair
            </UButton>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const sidebarOpen = ref(false)
const user = useSupabaseUser()
const client = useSupabaseClient()

const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}

const isActive = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// Formata nome com primeira letra maiúscula e resto minúsculo
const formatarNome = (nome: string) => {
  return nome
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ')
}

// Busca o nome do usuário dos metadados do Supabase Auth
const nomeUsuario = computed(() => {
  const metadata = user.value?.user_metadata
  // Pega apenas o primeiro nome para a saudação
  const nomeCompleto = metadata?.nome || metadata?.name || metadata?.full_name
  if (nomeCompleto) {
    const primeiroNome = nomeCompleto.split(' ')[0]
    return formatarNome(primeiroNome)
  }
  const emailNome = user.value?.email?.split('@')[0] || 'Usuário'
  return formatarNome(emailNome)
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  let saudacao = 'Bom dia'

  if (hour >= 12 && hour < 18) {
    saudacao = 'Boa tarde'
  } else if (hour >= 18 || hour < 6) {
    saudacao = 'Boa noite'
  }

  return `${saudacao}, ${nomeUsuario.value}!`
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// Close sidebar on route change (mobile)
watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>
