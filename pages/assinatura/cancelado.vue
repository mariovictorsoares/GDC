<template>
  <div class="min-h-screen flex items-center justify-center bg-operacao-50 px-4">
    <div class="max-w-md w-full text-center">
      <!-- Ícone -->
      <div class="mx-auto w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-amber-500" />
      </div>

      <h1 class="text-2xl font-bold text-operacao-800 mb-2">Checkout cancelado</h1>
      <p class="text-operacao-400 mb-8">
        O processo de pagamento foi cancelado. Você pode tentar novamente quando quiser.
      </p>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <NuxtLink
          to="/assinatura"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-guardian-500 to-guardian-600 hover:from-guardian-600 hover:to-guardian-700 hover:shadow-lg hover:shadow-guardian-500/30 transition-all duration-200"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" />
          Tentar novamente
        </NuxtLink>

        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl text-operacao-600 bg-white border border-operacao-200 hover:bg-operacao-50 transition-all duration-200"
        >
          Voltar ao sistema
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})
</script>
