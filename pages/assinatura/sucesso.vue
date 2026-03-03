<template>
  <div class="min-h-screen flex items-center justify-center bg-operacao-50 px-4">
    <div class="max-w-md w-full text-center">
      <!-- Ícone de sucesso -->
      <div class="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <UIcon name="i-heroicons-check-circle" class="w-12 h-12 text-green-500" />
      </div>

      <h1 class="text-2xl font-bold text-operacao-800 mb-2">Assinatura confirmada!</h1>
      <p class="text-operacao-400 mb-8">
        Seu plano foi ativado com sucesso. Agora você tem acesso completo ao sistema.
      </p>

      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-600 hover:to-guardian-700 hover:shadow-lg hover:shadow-guardian-500/30 transition-all duration-200"
      >
        <UIcon name="i-heroicons-home" class="w-5 h-5" />
        Ir para o Dashboard
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

// Recarregar assinatura para refletir o novo status
const { carregarAssinatura } = useAssinatura()
onMounted(async () => {
  await carregarAssinatura()
})
</script>
