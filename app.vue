<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Container para os toasts/notificacoes -->
    <UNotifications />
  </div>
</template>

<style>
/* Corrigir alinhamento vertical de ícones em botões */
button [class*="i-heroicons-"] {
  transform: translateY(1px);
}
</style>
