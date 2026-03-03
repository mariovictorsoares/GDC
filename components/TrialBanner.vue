<template>
  <div v-if="showBanner" class="mb-4">
    <!-- Trial ativo (dias restantes) -->
    <div
      v-if="subscriptionState.state === 'trial'"
      class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-guardian-50 to-blue-50 border border-guardian-200/60"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-guardian-100 flex items-center justify-center">
          <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-guardian-600" />
        </div>
        <p class="text-sm text-guardian-800">
          <span class="font-semibold">Teste grátis</span>
          <span class="mx-1.5 text-guardian-300">|</span>
          <span>{{ subscriptionState.diasRestantes }} dia{{ subscriptionState.diasRestantes! > 1 ? 's' : '' }} restante{{ subscriptionState.diasRestantes! > 1 ? 's' : '' }}</span>
        </p>
      </div>
      <NuxtLink
        to="/assinatura"
        class="flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-guardian-600 text-white hover:bg-guardian-700 transition-all duration-200 hover:shadow-md hover:shadow-guardian-500/20"
      >
        Assinar plano
      </NuxtLink>
    </div>

    <!-- Trial expirando (últimos 3 dias) -->
    <div
      v-else-if="subscriptionState.state === 'trial_warning'"
      class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
          <UIcon name="i-heroicons-clock" class="w-4 h-4 text-amber-600" />
        </div>
        <p class="text-sm text-amber-800">
          <span class="font-semibold">Teste expirando!</span>
          <span class="mx-1.5 text-amber-300">|</span>
          <span>{{ subscriptionState.diasRestantes }} dia{{ subscriptionState.diasRestantes! > 1 ? 's' : '' }} restante{{ subscriptionState.diasRestantes! > 1 ? 's' : '' }}. Assine para não perder acesso.</span>
        </p>
      </div>
      <NuxtLink
        to="/assinatura"
        class="flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-all duration-200 hover:shadow-md hover:shadow-amber-500/20"
      >
        Assinar agora
      </NuxtLink>
    </div>

    <!-- Grace Period (trial expirou) -->
    <div
      v-else-if="subscriptionState.state === 'grace'"
      class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-red-600" />
        </div>
        <p class="text-sm text-red-800 font-medium">
          Período de teste expirado. Assine para continuar usando o sistema.
        </p>
      </div>
      <NuxtLink
        to="/assinatura"
        class="flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 hover:shadow-md hover:shadow-red-500/20"
      >
        Escolher plano
      </NuxtLink>
    </div>

    <!-- Past Due (pagamento falhou) -->
    <div
      v-else-if="subscriptionState.state === 'past_due'"
      class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/60"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
          <UIcon name="i-heroicons-credit-card" class="w-4 h-4 text-orange-600" />
        </div>
        <p class="text-sm text-orange-800">
          <span class="font-medium">Pagamento pendente.</span> Atualize sua forma de pagamento para manter o acesso.
        </p>
      </div>
      <button
        class="flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-all duration-200 hover:shadow-md hover:shadow-orange-500/20"
        @click="handlePortal"
      >
        Atualizar pagamento
      </button>
    </div>

    <!-- Cancelled -->
    <div
      v-else-if="subscriptionState.state === 'cancelled'"
      class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60"
    >
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <div class="flex-shrink-0 w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
          <UIcon name="i-heroicons-x-circle" class="w-4 h-4 text-red-600" />
        </div>
        <p class="text-sm text-red-800">
          <span class="font-medium">Assinatura cancelada.</span> Reative para continuar usando o sistema.
        </p>
      </div>
      <NuxtLink
        to="/assinatura"
        class="flex-shrink-0 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200 hover:shadow-md hover:shadow-red-500/20"
      >
        Reativar
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showBanner, subscriptionState, abrirPortal } = useAssinatura()
const toast = useToast()

const handlePortal = async () => {
  try {
    await abrirPortal()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error?.data?.statusMessage || 'Não foi possível abrir o portal de pagamento.',
      color: 'red'
    })
  }
}
</script>
