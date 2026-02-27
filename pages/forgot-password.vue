<template>
  <div>
    <!-- Logo com fundo branco -->
    <div class="text-center mb-8">
      <div class="inline-block bg-white rounded-xl p-3 mb-4">
        <img src="/logo.png" alt="Guardião do CMV" class="h-14 w-auto" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Esqueceu a senha?</h1>
      <p class="text-gray-500 mt-1">Digite seu email para receber o link de recuperação</p>
    </div>

    <!-- Formulario -->
    <form v-if="!emailSent" @submit.prevent="handleForgotPassword" class="space-y-5">
      <div :class="{ 'animate-shake': emailError }">
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Email <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400" />
          </div>
          <input
            v-model="email"
            type="email"
            placeholder="seu@email.com"
            :disabled="loading"
            class="input-premium"
            @focus="emailError = false"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="btn-premium w-full"
      >
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Enviando...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-paper-airplane" class="w-5 h-5" />
          Enviar link de recuperação
        </span>
      </button>
    </form>

    <!-- Mensagem de sucesso -->
    <div v-else class="text-center py-6 animate-fade-in">
      <div class="w-20 h-20 bg-gradient-to-br from-controle-100 to-controle-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-controle-200/50">
        <div class="w-16 h-16 bg-gradient-to-br from-controle-400 to-controle-500 rounded-full flex items-center justify-center">
          <UIcon name="i-heroicons-envelope-open" class="w-8 h-8 text-white" />
        </div>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
      <p class="text-gray-500 mb-2">
        Enviamos um link de recuperação para
      </p>
      <p class="font-semibold text-guardian-600 mb-6">{{ email }}</p>

      <div class="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
        <p class="text-sm text-gray-500 flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-gray-400" />
          Não recebeu? Verifique a pasta de spam
        </p>
      </div>

      <button
        class="btn-outline w-full"
        :disabled="resendCooldown > 0"
        @click="handleResend"
      >
        <span v-if="resendCooldown > 0" class="flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-clock" class="w-5 h-5" />
          Reenviar em {{ resendCooldown }}s
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5" />
          Enviar novamente
        </span>
      </button>
    </div>

    <!-- Divisor -->
    <div class="relative my-8">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200" />
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-4 bg-white text-gray-500">ou</span>
      </div>
    </div>

    <!-- Link Voltar -->
    <p class="text-center text-gray-600">
      Lembrou a senha?
      <NuxtLink to="/login" class="text-guardian-500 hover:text-guardian-600 font-semibold transition-colors">
        Voltar ao login
      </NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

const loading = ref(false)
const email = ref('')
const emailSent = ref(false)
const emailError = ref(false)
const resendCooldown = ref(0)

// Redirecionar se já estiver logado
watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

// Cooldown timer
let cooldownInterval: NodeJS.Timeout | null = null

const startCooldown = () => {
  resendCooldown.value = 60
  cooldownInterval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && cooldownInterval) {
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

onUnmounted(() => {
  if (cooldownInterval) clearInterval(cooldownInterval)
})

const handleResend = () => {
  emailSent.value = false
}

const handleForgotPassword = async () => {
  // Reset error
  emailError.value = false

  // Validação de campo vazio
  if (!email.value) {
    emailError.value = true
    toast.add({
      title: 'Campo obrigatório',
      description: 'Digite seu email para continuar.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = true
    toast.add({
      title: 'Email inválido',
      description: 'Digite um endereço de email válido.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  try {
    loading.value = true

    const { error } = await client.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error

    emailSent.value = true
    startCooldown()

    toast.add({
      title: 'Email enviado!',
      description: 'Verifique sua caixa de entrada.',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)

    // Tratamento de erros específicos
    let titulo = 'Erro ao enviar'
    let mensagem = 'Ocorreu um erro inesperado. Tente novamente.'

    if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
      titulo = 'Muitas tentativas'
      mensagem = 'Aguarde alguns minutos antes de tentar novamente.'
    } else if (error.message?.includes('not found') || error.message?.includes('User not found')) {
      titulo = 'Email não encontrado'
      mensagem = 'Não encontramos uma conta com este email.'
      emailError.value = true
    } else if (error.message?.includes('Network')) {
      titulo = 'Erro de conexão'
      mensagem = 'Verifique sua conexão com a internet.'
    }

    toast.add({
      title: titulo,
      description: mensagem,
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Input premium com micro-interações */
.input-premium {
  @apply w-full pl-10 pr-4 py-3 text-base rounded-xl border border-gray-200 bg-gray-50/50;
  @apply transition-all duration-300 ease-out;
  @apply focus:bg-white focus:border-guardian-400 focus:ring-4 focus:ring-guardian-100 focus:outline-none;
  @apply placeholder-gray-400;
  @apply disabled:opacity-50 disabled:cursor-not-allowed;
}

.input-premium:hover:not(:focus):not(:disabled) {
  @apply border-gray-300 bg-white;
}

/* Botão premium com micro-interações */
.btn-premium {
  @apply py-3.5 px-6 text-base font-semibold rounded-xl text-white;
  @apply bg-gradient-to-r from-guardian-500 to-guardian-600;
  @apply transition-all duration-300 ease-out;
  @apply hover:from-guardian-600 hover:to-guardian-700 hover:shadow-lg hover:shadow-guardian-500/30 hover:-translate-y-0.5;
  @apply active:translate-y-0 active:shadow-md;
  @apply focus:outline-none focus:ring-4 focus:ring-guardian-200;
  @apply disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none;
}

/* Botão outline */
.btn-outline {
  @apply py-3 px-6 text-base font-semibold rounded-xl;
  @apply bg-white text-guardian-600 border-2 border-guardian-200;
  @apply transition-all duration-300 ease-out;
  @apply hover:bg-guardian-50 hover:border-guardian-300 hover:shadow-md;
  @apply active:bg-guardian-100;
  @apply focus:outline-none focus:ring-4 focus:ring-guardian-100;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-none;
}

/* Animação de shake para erros */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-4px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.4s ease-in-out;
}

/* Animação de fade-in */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
</style>
