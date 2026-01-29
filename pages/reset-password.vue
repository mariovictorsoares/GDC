<template>
  <div>
    <!-- Logo e Titulo -->
    <div class="text-center mb-8">
      <img src="/logo-guardiao.png" alt="Guardião do CMV" class="h-16 w-auto mx-auto mb-4" />
      <h1 class="text-2xl font-bold text-gray-900">Nova senha</h1>
      <p class="text-gray-500 mt-1">Digite sua nova senha abaixo</p>
    </div>

    <!-- Formulario -->
    <form v-if="!success" @submit.prevent="handleResetPassword" class="space-y-5">
      <UFormGroup label="Nova senha" required>
        <UInput
          v-model="form.password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          icon="i-heroicons-lock-closed"
          size="lg"
          :disabled="loading"
        />
      </UFormGroup>

      <UFormGroup label="Confirmar nova senha" required>
        <UInput
          v-model="form.confirmPassword"
          type="password"
          placeholder="Repita a nova senha"
          icon="i-heroicons-lock-closed"
          size="lg"
          :disabled="loading"
        />
      </UFormGroup>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="loading"
        class="mt-6"
      >
        Alterar senha
      </UButton>
    </form>

    <!-- Mensagem de sucesso -->
    <div v-else class="text-center py-8">
      <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-heroicons-check" class="w-8 h-8 text-green-600" />
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Senha alterada!</h2>
      <p class="text-gray-500 mb-6">
        Sua senha foi alterada com sucesso.<br />
        Agora você pode fazer login com a nova senha.
      </p>
      <UButton @click="navigateTo('/login')">
        Ir para o login
      </UButton>
    </div>

    <!-- Link Voltar (só mostra se não teve sucesso) -->
    <div v-if="!success" class="mt-8">
      <div class="relative my-8">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-gray-50 text-gray-500">ou</span>
        </div>
      </div>

      <p class="text-center text-gray-600">
        <NuxtLink to="/login" class="text-guardian-500 hover:text-guardian-600 font-semibold">
          Voltar ao login
        </NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const client = useSupabaseClient()
const toast = useToast()
const route = useRoute()

const loading = ref(false)
const success = ref(false)
const form = ref({
  password: '',
  confirmPassword: ''
})

// Verificar se há um token de recuperação na URL
onMounted(async () => {
  // O Supabase automaticamente processa o token na URL
  // Verificamos se há erro no hash da URL
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const error = hashParams.get('error')
  const errorDescription = hashParams.get('error_description')

  if (error) {
    toast.add({
      title: 'Link inválido',
      description: errorDescription || 'O link de recuperação expirou ou é inválido.',
      icon: 'i-heroicons-x-circle',
      color: 'red'
    })
  }
})

const handleResetPassword = async () => {
  // Validação de campos vazios
  if (!form.value.password || !form.value.confirmPassword) {
    toast.add({
      title: 'Campos obrigatórios',
      description: 'Preencha todos os campos para continuar.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  // Validação de senhas
  if (form.value.password !== form.value.confirmPassword) {
    toast.add({
      title: 'Senhas diferentes',
      description: 'As senhas digitadas não coincidem.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'red'
    })
    return
  }

  // Validação de tamanho mínimo
  if (form.value.password.length < 6) {
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

    const { error } = await client.auth.updateUser({
      password: form.value.password
    })

    if (error) throw error

    success.value = true

    toast.add({
      title: 'Senha alterada!',
      description: 'Sua senha foi alterada com sucesso.',
      icon: 'i-heroicons-check-circle',
      color: 'green'
    })

    // Fazer logout para forçar novo login com a nova senha
    await client.auth.signOut()
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error)

    // Tratamento de erros específicos
    let titulo = 'Erro ao alterar senha'
    let mensagem = 'Ocorreu um erro inesperado. Tente novamente.'

    if (error.message?.includes('session') || error.message?.includes('not authenticated')) {
      titulo = 'Sessão expirada'
      mensagem = 'O link de recuperação expirou. Solicite um novo.'
    } else if (error.message?.includes('same password') || error.message?.includes('different')) {
      titulo = 'Senha inválida'
      mensagem = 'A nova senha deve ser diferente da anterior.'
    } else if (error.message?.includes('Password')) {
      titulo = 'Senha inválida'
      mensagem = 'A senha não atende aos requisitos mínimos.'
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
