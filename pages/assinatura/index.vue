<template>
  <div class="relative min-h-screen bg-white overflow-hidden">
    <!-- ============ MESH GRADIENT BACKGROUND ============ -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden">
      <div class="absolute -top-[300px] -left-[200px] w-[800px] h-[800px] rounded-full blur-[200px] animate-drift-slow bg-guardian-500/[0.04]" />
      <div class="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full blur-[180px] animate-drift-slow-reverse bg-alerta-400/[0.03]" />
    </div>

    <div class="relative z-10">
      <!-- ============ TOP BAR ============ -->
      <header class="flex items-center justify-between px-6 sm:px-10 py-5">
        <img src="/logo-cmv360.png" alt="CMV360" class="h-8 w-auto" />
        <NuxtLink
          to="/"
          class="text-sm text-operacao-400 hover:text-operacao-600 transition-colors inline-flex items-center gap-1.5"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
          Voltar ao sistema
        </NuxtLink>
      </header>

      <!-- ============ HERO ============ -->
      <div class="text-center pt-6 pb-10 px-4">
        <h1 class="text-3xl sm:text-4xl font-extrabold text-operacao-900 tracking-tight">
          Escolha seu plano
        </h1>
        <p class="mt-3 text-base sm:text-lg text-operacao-400 max-w-md mx-auto">
          Comece grátis por 14 dias. Sem cartão de crédito.
        </p>

        <!-- Trial info -->
        <div
          v-if="isTrialAtivo"
          class="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-guardian-50 border border-guardian-100 text-sm text-guardian-700"
        >
          <UIcon name="i-heroicons-clock" class="w-4 h-4 text-guardian-500" />
          <span>
            <strong>{{ subscriptionState.diasRestantes }} dia{{ subscriptionState.diasRestantes! > 1 ? 's' : '' }}</strong> restantes no teste grátis
          </span>
        </div>

        <!-- Trial expirado -->
        <div
          v-else-if="subscriptionState.state === 'grace' || subscriptionState.state === 'blocked'"
          class="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-sm text-red-700"
        >
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-500" />
          <span>Seu período de teste expirou. Assine para continuar.</span>
        </div>
      </div>

      <!-- ============ PRICING CARDS ============ -->
      <div class="max-w-5xl mx-auto px-4 sm:px-6 pb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          <!-- SILVER -->
          <div
            class="group relative bg-white rounded-2xl border border-operacao-200 p-7 transition-all duration-300 hover:shadow-xl hover:shadow-operacao-900/[0.04] hover:-translate-y-1"
          >
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
                  <path d="M12 2L3 6v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4z" stroke="url(#silver-s)" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M9.5 12l2 2 3.5-4" stroke="url(#silver-s)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <defs><linearGradient id="silver-s" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#94a3b8"/><stop offset="1" stop-color="#475569"/></linearGradient></defs>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-operacao-800">Silver</h3>
            </div>

            <p class="text-sm text-operacao-400 leading-relaxed mb-6">
              Acesso completo ao sistema de gestão de estoque.
            </p>

            <div class="flex items-baseline gap-0.5 mb-7">
              <span class="text-sm font-medium text-operacao-400">R$</span>
              <span class="text-4xl font-extrabold text-operacao-900 tracking-tight">197</span>
              <span class="text-sm text-operacao-400 ml-1">/mês</span>
            </div>

            <button
              :disabled="assinando === 'silver'"
              class="w-full py-3 px-4 text-sm font-semibold rounded-xl border-2 border-operacao-800 text-operacao-800 hover:bg-operacao-800 hover:text-white transition-all duration-200"
              :class="assinando === 'silver' ? 'opacity-50 cursor-not-allowed' : ''"
              @click="handleAssinar('silver')"
            >
              <span v-if="assinando === 'silver'" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Processando...
              </span>
              <span v-else>Assinar Silver</span>
            </button>

            <div class="mt-7 space-y-3">
              <li v-for="recurso in silverFeatures" :key="recurso" class="flex items-start gap-2.5 list-none">
                <UIcon name="i-heroicons-check" class="w-4 h-4 flex-shrink-0 mt-0.5 text-operacao-400" />
                <span class="text-sm text-operacao-500">{{ recurso }}</span>
              </li>
            </div>
          </div>

          <!-- GOLD (destaque) -->
          <div
            class="group relative bg-white rounded-2xl border-2 border-guardian-500 p-7 transition-all duration-300 hover:shadow-xl hover:shadow-guardian-500/[0.12] hover:-translate-y-1 shadow-lg shadow-guardian-500/[0.08]"
          >
            <!-- Badge -->
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-guardian-500 text-[11px] font-bold text-white uppercase tracking-wider shadow-md shadow-guardian-500/30">
                Mais popular
              </span>
            </div>

            <div class="flex items-center gap-3 mb-5 mt-1">
              <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
                  <path d="M4 17h16l2-10-5.5 4-4.5-7-4.5 7L2 7l2 10z" stroke="url(#gold-s)" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M4 19.5h16" stroke="url(#gold-s)" stroke-width="1.5" stroke-linecap="round"/>
                  <defs><linearGradient id="gold-s" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse"><stop stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-operacao-800">Gold</h3>
            </div>

            <p class="text-sm text-operacao-400 leading-relaxed mb-6">
              App + acompanhamento mensal de fechamento.
            </p>

            <div class="flex items-baseline gap-0.5 mb-7">
              <span class="text-sm font-medium text-operacao-400">R$</span>
              <span class="text-4xl font-extrabold text-operacao-900 tracking-tight">497</span>
              <span class="text-sm text-operacao-400 ml-1">/mês</span>
            </div>

            <button
              :disabled="assinando === 'gold'"
              class="w-full py-3 px-4 text-sm font-semibold rounded-xl bg-guardian-500 text-white hover:bg-guardian-600 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-guardian-500/25"
              :class="assinando === 'gold' ? 'opacity-50 cursor-not-allowed' : ''"
              @click="handleAssinar('gold')"
            >
              <span v-if="assinando === 'gold'" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Processando...
              </span>
              <span v-else>Assinar Gold</span>
            </button>

            <div class="mt-7 space-y-3">
              <li v-for="recurso in goldFeatures" :key="recurso" class="flex items-start gap-2.5 list-none">
                <UIcon name="i-heroicons-check" class="w-4 h-4 flex-shrink-0 mt-0.5 text-guardian-600" />
                <span class="text-sm text-operacao-500">{{ recurso }}</span>
              </li>
            </div>
          </div>

          <!-- DIAMOND -->
          <div
            class="group relative bg-white rounded-2xl border border-operacao-200 p-7 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/[0.08] hover:-translate-y-1"
          >
            <div class="flex items-center gap-3 mb-5">
              <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none">
                  <path d="M12 22L2 10l4-7h12l4 7-10 12z" stroke="url(#diamond-s)" stroke-width="1.5" stroke-linejoin="round"/>
                  <path d="M2 10h20M8.5 3L10 10M15.5 3L14 10M12 10l-10 0M12 10v12" stroke="url(#diamond-s)" stroke-width="1" stroke-linejoin="round" stroke-opacity="0.5"/>
                  <defs><linearGradient id="diamond-s" x1="2" y1="3" x2="22" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#a855f7"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-operacao-800">Diamond</h3>
            </div>

            <p class="text-sm text-operacao-400 leading-relaxed mb-6">
              App + curso completo e formação do estoquista.
            </p>

            <div class="flex items-baseline gap-0.5 mb-7">
              <span class="text-sm font-medium text-operacao-400">R$</span>
              <span class="text-4xl font-extrabold text-operacao-900 tracking-tight">997</span>
              <span class="text-sm text-operacao-400 ml-1">/mês</span>
            </div>

            <button
              :disabled="assinando === 'diamond'"
              class="w-full py-3 px-4 text-sm font-semibold rounded-xl border-2 border-purple-500 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-200"
              :class="assinando === 'diamond' ? 'opacity-50 cursor-not-allowed' : ''"
              @click="handleAssinar('diamond')"
            >
              <span v-if="assinando === 'diamond'" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Processando...
              </span>
              <span v-else>Assinar Diamond</span>
            </button>

            <div class="mt-7 space-y-3">
              <li v-for="recurso in diamondFeatures" :key="recurso" class="flex items-start gap-2.5 list-none">
                <UIcon name="i-heroicons-check" class="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-500" />
                <span class="text-sm text-operacao-500">{{ recurso }}</span>
              </li>
            </div>
          </div>

        </div>
      </div>

      <!-- ============ TRUST BADGES ============ -->
      <div class="max-w-3xl mx-auto px-4 py-10">
        <div class="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-operacao-400">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-clock" class="w-4 h-4 text-operacao-300" />
            <span>14 dias de teste grátis</span>
          </div>
          <div class="hidden sm:block w-1 h-1 rounded-full bg-operacao-200" />
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-operacao-300" />
            <span>Cancele quando quiser</span>
          </div>
          <div class="hidden sm:block w-1 h-1 rounded-full bg-operacao-200" />
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-shield-check" class="w-4 h-4 text-operacao-300" />
            <span>Pagamento seguro via Stripe</span>
          </div>
        </div>
      </div>

      <!-- ============ TAXA DE IMPLANTAÇÃO ============ -->
      <div class="text-center pb-10 px-4">
        <p class="text-xs text-operacao-300">
          Taxa de implantação de R$ 497,00 cobrada junto à primeira mensalidade. Inclui configuração e treinamento inicial.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const toast = useToast()
const { planos, carregarPlanos, subscriptionState, iniciarCheckout } = useAssinatura()

const assinando = ref<string | null>(null)

const silverFeatures = [
  'Acesso completo ao sistema',
  'Controle de estoque em tempo real',
  'Relatórios de CMV e giro',
  'Contagens e inventário',
  'Gestão de compras',
  'Suporte via WhatsApp',
]

const goldFeatures = [
  'Tudo do plano Silver',
  'Acompanhamento mensal de fechamento',
  'Reunião de análise de resultados',
  'Consultoria de redução de CMV',
  'Suporte prioritário',
]

const diamondFeatures = [
  'Tudo do plano Gold',
  'Curso completo de gestão de estoque',
  'Formação do estoquista da sua equipe',
  'Treinamento presencial ou online',
  'Acompanhamento semanal',
]

const isTrialAtivo = computed(() => {
  return subscriptionState.value.state === 'trial' || subscriptionState.value.state === 'trial_warning'
})

onMounted(async () => {
  await carregarPlanos()
})

const handleAssinar = async (slug: string) => {
  assinando.value = slug
  try {
    await iniciarCheckout(slug)
  } catch (error: any) {
    const msg = error?.data?.statusMessage || error?.message || 'Erro ao iniciar pagamento'
    toast.add({
      title: 'Erro',
      description: msg,
      color: 'red'
    })
  } finally {
    assinando.value = null
  }
}
</script>

<style scoped>
@keyframes drift-slow {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 20px); }
}
@keyframes drift-slow-reverse {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(-20px, 15px); }
}

.animate-drift-slow { animation: drift-slow 30s ease-in-out infinite; }
.animate-drift-slow-reverse { animation: drift-slow-reverse 35s ease-in-out infinite; }
</style>
