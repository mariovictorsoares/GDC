<template>
  <div>
    <!-- Logo com fundo branco -->
    <div class="text-center mb-8">
      <div class="inline-block bg-white rounded-xl p-3 mb-4">
        <img src="/logo.png" alt="Guardião do CMV" class="h-14 w-auto" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Bem-vindo de volta!</h1>
      <p class="text-gray-500 mt-1">Entre com suas credenciais para acessar</p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleLogin" class="space-y-5">
      <div :class="{ 'animate-shake': emailError }">
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Email <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UIcon name="i-heroicons-envelope" class="w-5 h-5 text-gray-400" />
          </div>
          <input
            v-model="form.email"
            type="email"
            placeholder="seu@email.com"
            :disabled="loading"
            class="input-premium"
            @focus="emailError = false"
          />
        </div>
      </div>

      <div :class="{ 'animate-shake': passwordError }">
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Senha <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-gray-400" />
          </div>
          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Digite sua senha"
            :disabled="loading"
            class="input-premium pr-12"
            @focus="passwordError = false"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
            @click="togglePassword"
          >
            <div class="eye-toggle">
              <UIcon
                :name="showPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                class="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Link Esqueci Senha -->
      <div class="flex justify-end">
        <NuxtLink
          to="/forgot-password"
          class="text-sm text-guardian-500 hover:text-guardian-600 font-medium transition-colors"
        >
          Esqueceu a senha?
        </NuxtLink>
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
          Entrando...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5" />
          Entrar
        </span>
      </button>
    </form>

    <!-- Divisor -->
    <div class="relative my-8">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-200" />
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-4 bg-white text-gray-500">ou</span>
      </div>
    </div>

    <!-- Link Criar Conta -->
    <p class="text-center text-gray-600">
      Não tem uma conta?
      <NuxtLink to="/register" class="text-guardian-500 hover:text-guardian-600 font-semibold transition-colors">
        Criar conta gratuita
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
const showPassword = ref(false)
const emailError = ref(false)
const passwordError = ref(false)

const form = ref({
  email: '',
  password: ''
})

// Redirecionar se já estiver logado
watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

const togglePassword = () => {
  showPassword.value = !showPassword.value
}

const handleLogin = async () => {
  // Reset errors
  emailError.value = false
  passwordError.value = false

  // Validação de campos vazios
  if (!form.value.email) {
    emailError.value = true
  }
  if (!form.value.password) {
    passwordError.value = true
  }

  if (!form.value.email || !form.value.password) {
    toast.add({
      title: 'Campos obrigatórios',
      description: 'Preencha o email e a senha para continuar.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  // Validação de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
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

    const { data, error } = await client.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password
    })

    if (error) throw error

    if (data.session) {
      toast.add({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta ao Guardião do CMV.',
        icon: 'i-heroicons-check-circle',
        color: 'green'
      })

      await navigateTo('/')
    }
  } catch (error: any) {
    console.error('Erro de login:', error)

    // Shake nos campos com erro
    emailError.value = true
    passwordError.value = true

    // Tratamento de erros específicos
    let titulo = 'Erro ao entrar'
    let mensagem = 'Ocorreu um erro inesperado. Tente novamente.'

    if (error.message === 'Invalid login credentials') {
      titulo = 'Credenciais inválidas'
      mensagem = 'Email ou senha incorretos. Verifique e tente novamente.'
    } else if (error.message?.includes('Email not confirmed')) {
      titulo = 'Email não confirmado'
      mensagem = 'Verifique sua caixa de entrada e confirme seu email.'
    } else if (error.message?.includes('Too many requests')) {
      titulo = 'Muitas tentativas'
      mensagem = 'Aguarde alguns minutos antes de tentar novamente.'
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

/* Toggle de senha com animação */
.eye-toggle {
  @apply transition-transform duration-200;
}

.eye-toggle:active {
  @apply scale-90;
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
</style>
