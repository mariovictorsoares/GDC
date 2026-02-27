<template>
  <div>
    <!-- Logo com fundo branco -->
    <div class="text-center mb-8">
      <div class="inline-block bg-white rounded-xl p-3 mb-4">
        <img src="/logo.png" alt="Guardião do CMV" class="h-14 w-auto" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Crie sua conta</h1>
      <p class="text-gray-500 mt-1">Comece a controlar seu estoque agora mesmo</p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div :class="{ 'animate-shake': nameError }">
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Nome completo <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-400" />
          </div>
          <input
            v-model="form.name"
            type="text"
            placeholder="Seu nome"
            :disabled="loading"
            class="input-premium"
            @focus="nameError = false"
          />
        </div>
      </div>

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
            placeholder="Mínimo 6 caracteres"
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
        <!-- Indicador de força da senha -->
        <div v-if="form.password" class="mt-2">
          <div class="flex gap-1">
            <div
              v-for="i in 4"
              :key="i"
              class="h-1 flex-1 rounded-full transition-all duration-300"
              :class="getPasswordStrengthClass(i)"
            />
          </div>
          <p class="text-xs mt-1" :class="passwordStrengthColor">{{ passwordStrengthText }}</p>
        </div>
      </div>

      <div :class="{ 'animate-shake': confirmPasswordError }">
        <label class="block text-sm font-medium text-gray-700 mb-1.5">
          Confirmar senha <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <UIcon name="i-heroicons-lock-closed" class="w-5 h-5 text-gray-400" />
          </div>
          <input
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Repita a senha"
            :disabled="loading"
            class="input-premium pr-12"
            @focus="confirmPasswordError = false"
          />
          <button
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center"
            @click="toggleConfirmPassword"
          >
            <div class="eye-toggle">
              <UIcon
                :name="showConfirmPassword ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'"
                class="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
              />
            </div>
          </button>
        </div>
        <!-- Indicador de match -->
        <div v-if="form.confirmPassword" class="mt-2 flex items-center gap-1.5">
          <UIcon
            :name="passwordsMatch ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
            class="w-4 h-4"
            :class="passwordsMatch ? 'text-controle-500' : 'text-red-500'"
          />
          <p class="text-xs" :class="passwordsMatch ? 'text-controle-600' : 'text-red-500'">
            {{ passwordsMatch ? 'Senhas coincidem' : 'Senhas não coincidem' }}
          </p>
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="btn-premium w-full mt-6"
      >
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Criando conta...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <UIcon name="i-heroicons-user-plus" class="w-5 h-5" />
          Criar conta
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

    <!-- Link Login -->
    <p class="text-center text-gray-600">
      Já tem uma conta?
      <NuxtLink to="/login" class="text-guardian-500 hover:text-guardian-600 font-semibold transition-colors">
        Fazer login
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
const showConfirmPassword = ref(false)
const nameError = ref(false)
const emailError = ref(false)
const passwordError = ref(false)
const confirmPasswordError = ref(false)

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
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

const toggleConfirmPassword = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}

// Verificar força da senha
const passwordStrength = computed(() => {
  const password = form.value.password
  let strength = 0

  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength++

  return strength
})

const passwordStrengthText = computed(() => {
  const texts = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  return texts[passwordStrength.value] || ''
})

const passwordStrengthColor = computed(() => {
  const colors = ['', 'text-red-500', 'text-alerta-500', 'text-controle-500', 'text-controle-600']
  return colors[passwordStrength.value] || ''
})

const getPasswordStrengthClass = (index: number) => {
  if (index <= passwordStrength.value) {
    const colors = ['bg-red-400', 'bg-alerta-400', 'bg-controle-400', 'bg-controle-500']
    return colors[passwordStrength.value - 1] || 'bg-gray-200'
  }
  return 'bg-gray-200'
}

const passwordsMatch = computed(() => {
  return form.value.password === form.value.confirmPassword && form.value.confirmPassword !== ''
})

const handleRegister = async () => {
  // Reset errors
  nameError.value = false
  emailError.value = false
  passwordError.value = false
  confirmPasswordError.value = false

  // Validação de campos vazios
  if (!form.value.name) nameError.value = true
  if (!form.value.email) emailError.value = true
  if (!form.value.password) passwordError.value = true
  if (!form.value.confirmPassword) confirmPasswordError.value = true

  if (!form.value.name || !form.value.email || !form.value.password || !form.value.confirmPassword) {
    toast.add({
      title: 'Campos obrigatórios',
      description: 'Preencha todos os campos para continuar.',
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

  // Validação de senhas
  if (form.value.password !== form.value.confirmPassword) {
    passwordError.value = true
    confirmPasswordError.value = true
    toast.add({
      title: 'Senhas diferentes',
      description: 'As senhas digitadas não coincidem.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  // Validação de tamanho mínimo da senha
  if (form.value.password.length < 6) {
    passwordError.value = true
    toast.add({
      title: 'Senha muito curta',
      description: 'A senha deve ter no mínimo 6 caracteres.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  try {
    loading.value = true

    const { data, error } = await client.auth.signUp({
      email: form.value.email,
      password: form.value.password,
      options: {
        data: {
          name: form.value.name
        }
      }
    })

    if (error) throw error

    if (data.session) {
      // Login automático após registro
      toast.add({
        title: 'Conta criada!',
        description: 'Bem-vindo ao Guardião do CMV!',
        icon: 'i-heroicons-check-circle',
        color: 'green'
      })

      await navigateTo('/')
    } else if (data.user) {
      // Supabase requer confirmação de email
      toast.add({
        title: 'Verifique seu email',
        description: 'Enviamos um link de confirmação para ' + form.value.email,
        icon: 'i-heroicons-envelope',
        color: 'green'
      })

      // Limpar formulário
      form.value = { name: '', email: '', password: '', confirmPassword: '' }
    }
  } catch (error: any) {
    console.error('Erro no registro:', error)

    // Tratamento de erros específicos
    let titulo = 'Erro ao criar conta'
    let mensagem = 'Ocorreu um erro inesperado. Tente novamente.'

    if (
      error.message?.includes('already registered') ||
      error.message?.includes('already been registered') ||
      error.message?.includes('User already registered') ||
      error.status === 422
    ) {
      titulo = 'Email já cadastrado'
      mensagem = 'Este email já possui uma conta. Tente fazer login.'
      emailError.value = true
    } else if (error.message?.includes('Password')) {
      titulo = 'Senha inválida'
      mensagem = 'A senha não atende aos requisitos mínimos.'
      passwordError.value = true
    } else if (error.message?.includes('email')) {
      titulo = 'Email inválido'
      mensagem = 'O email informado não é válido.'
      emailError.value = true
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
