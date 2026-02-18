<template>
  <div class="min-h-screen flex">
    <!-- ========================================== -->
    <!-- LADO ESQUERDO - Branding -->
    <!-- ========================================== -->
    <div class="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-guardian-900 via-guardian-800 to-guardian-900 overflow-hidden">
      <!-- Padrão decorativo de fundo -->
      <div class="absolute inset-0 opacity-[0.07]">
        <div class="absolute top-0 left-0 w-full h-full"
          style="background-image: radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px); background-size: 50px 50px;"
        />
      </div>

      <!-- Glow decorativo -->
      <div class="absolute top-1/4 -left-20 w-80 h-80 bg-guardian-500/20 rounded-full blur-3xl" />
      <div class="absolute bottom-1/4 right-0 w-60 h-60 bg-alerta-500/15 rounded-full blur-3xl" />

      <!-- Conteúdo centralizado -->
      <div class="relative z-10 flex flex-col items-center justify-center w-full px-12">
        <!-- Logo -->
        <img src="/logo-guardiao.png" alt="Guardião do CMV" class="h-20 w-auto mb-10 drop-shadow-2xl" />

        <!-- Headline -->
        <h1 class="text-3xl font-bold text-white text-center leading-tight mb-4">
          Controle total do seu
          <span class="bg-gradient-to-r from-alerta-400 to-alerta-300 bg-clip-text text-transparent">
            CMV
          </span>
        </h1>
        <p class="text-guardian-300 text-center text-base max-w-sm leading-relaxed mb-12">
          Gerencie estoque, monitore custos e tome decisões inteligentes para o seu negócio.
        </p>

        <!-- Feature cards -->
        <div class="space-y-3 w-full max-w-xs">
          <div class="flex items-center gap-3 bg-white/[0.08] backdrop-blur-sm rounded-xl px-4 py-3 border border-white/[0.06]">
            <div class="w-9 h-9 rounded-lg bg-controle-500/20 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-chart-bar" class="w-4.5 h-4.5 text-controle-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-white/90">Relatórios em tempo real</p>
              <p class="text-xs text-guardian-400">CMV, Curva ABC, Giro de Estoque</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-white/[0.08] backdrop-blur-sm rounded-xl px-4 py-3 border border-white/[0.06]">
            <div class="w-9 h-9 rounded-lg bg-alerta-500/20 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-bell-alert" class="w-4.5 h-4.5 text-alerta-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-white/90">Alertas de estoque mínimo</p>
              <p class="text-xs text-guardian-400">Nunca fique sem produto</p>
            </div>
          </div>

          <div class="flex items-center gap-3 bg-white/[0.08] backdrop-blur-sm rounded-xl px-4 py-3 border border-white/[0.06]">
            <div class="w-9 h-9 rounded-lg bg-guardian-500/20 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-building-storefront" class="w-4.5 h-4.5 text-guardian-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-white/90">Multi-empresa</p>
              <p class="text-xs text-guardian-400">Gerencie várias operações</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="absolute bottom-6 left-0 right-0 text-center">
        <p class="text-xs text-guardian-500">&copy; {{ new Date().getFullYear() }} Guardião do CMV</p>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- LADO DIREITO - Formulário -->
    <!-- ========================================== -->
    <div class="flex-1 flex items-center justify-center bg-gray-50 px-4 py-8 sm:px-8">
      <div class="w-full max-w-md">
        <!-- Logo mobile -->
        <div class="lg:hidden text-center mb-8">
          <img src="/logo-guardiao.png" alt="Guardião do CMV" class="h-12 w-auto mx-auto" />
        </div>

        <!-- Header -->
        <div class="mb-8">
          <h2 class="text-2xl font-bold text-gray-900">Configure sua empresa</h2>
          <p class="text-gray-500 mt-1.5">Preencha os dados abaixo para começar a usar o sistema.</p>
        </div>

        <!-- Stepper -->
        <div class="flex items-center gap-3 mb-8">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-guardian-600 text-white flex items-center justify-center text-xs font-bold shadow-sm shadow-guardian-500/30">
              1
            </div>
            <span class="text-sm font-semibold text-guardian-700">Criar empresa</span>
          </div>
          <div class="flex-1 h-px bg-gray-200" />
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <span class="text-sm text-gray-400">Começar</span>
          </div>
        </div>

        <!-- Formulário -->
        <form @submit.prevent="criarPrimeiraEmpresa" class="space-y-5">
          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Nome da Empresa <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="nome"
              placeholder="Ex: Restaurante Sabor & Arte"
              size="lg"
              autofocus
              :ui="{ rounded: 'rounded-xl', color: { white: { outline: 'bg-white' } } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-building-office" class="w-5 h-5 text-gray-400" />
              </template>
            </UInput>
          </div>

          <!-- CNPJ -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              CNPJ <span class="text-gray-400 font-normal">(opcional)</span>
            </label>
            <UInput
              :value="cnpjFormatado"
              placeholder="00.000.000/0000-00"
              size="lg"
              maxlength="18"
              @input="onCnpjInput"
              :ui="{ rounded: 'rounded-xl', color: { white: { outline: 'bg-white' } } }"
            >
              <template #leading>
                <UIcon name="i-heroicons-identification" class="w-5 h-5 text-gray-400" />
              </template>
            </UInput>
          </div>

          <!-- Upload de Logo -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Logo <span class="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div
              class="relative flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer"
              :class="isDragging ? 'border-guardian-400 bg-guardian-50 shadow-md shadow-guardian-500/10' : 'border-gray-200 hover:border-guardian-300 hover:shadow-sm'"
              @click="triggerFileInput"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="handleDrop"
            >
              <div class="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img v-if="logoPreview" :src="logoPreview" class="w-full h-full object-cover" />
                <UIcon v-else name="i-heroicons-cloud-arrow-up" class="w-6 h-6 text-gray-300" />
              </div>
              <div class="text-sm flex-1 min-w-0">
                <p v-if="logoFile" class="font-medium text-gray-700 truncate">{{ logoFile.name }}</p>
                <p v-else class="font-medium text-gray-500">Clique ou arraste uma imagem</p>
                <p class="text-xs text-gray-400 mt-0.5">PNG, JPG ou WebP - até 2MB</p>
              </div>
              <!-- Botão remover -->
              <button
                v-if="logoFile"
                type="button"
                class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md flex items-center justify-center transition-all duration-150 hover:scale-110"
                @click.stop="removeLogo"
              >
                <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
              </button>
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden"
                @change="handleFileSelect"
              />
            </div>
            <p v-if="logoError" class="text-xs text-red-500 mt-1">{{ logoError }}</p>
          </div>

          <!-- Info box -->
          <div class="flex gap-3 p-3.5 bg-guardian-50 rounded-xl border border-guardian-100">
            <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-guardian-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-guardian-700">
              Você poderá criar mais empresas e alternar entre elas a qualquer momento.
            </p>
          </div>

          <!-- Botão -->
          <button
            type="submit"
            :disabled="!nome.trim() || criando"
            class="w-full py-3.5 px-6 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-guardian-500 to-guardian-600 transition-all duration-300 hover:from-guardian-600 hover:to-guardian-700 hover:shadow-lg hover:shadow-guardian-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md focus:outline-none focus:ring-4 focus:ring-guardian-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <span v-if="criando" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Criando empresa...
            </span>
            <span v-else class="flex items-center justify-center gap-2">
              <UIcon name="i-heroicons-rocket-launch" class="w-5 h-5" />
              Criar e Começar
            </span>
          </button>
        </form>

        <!-- Logout -->
        <div class="text-center mt-8">
          <button
            class="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5"
            @click="logout"
          >
            <UIcon name="i-heroicons-arrow-left-on-rectangle" class="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const toast = useToast()
const client = useSupabaseClient()
const { criarEmpresa, atualizarEmpresa } = useEmpresa()

const nome = ref('')
const cnpjRaw = ref('')
const criando = ref(false)

// Logo upload
const fileInput = ref<HTMLInputElement | null>(null)
const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)
const logoError = ref('')
const isDragging = ref(false)

// CNPJ formatado como computed
const cnpjFormatado = computed(() => {
  const v = cnpjRaw.value
  if (v.length > 12) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5')
  if (v.length > 8) return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4')
  if (v.length > 5) return v.replace(/^(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3')
  if (v.length > 2) return v.replace(/^(\d{2})(\d{1,3})/, '$1.$2')
  return v
})

const onCnpjInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let raw = input.value.replace(/\D/g, '')
  if (raw.length > 14) raw = raw.slice(0, 14)
  cnpjRaw.value = raw
  nextTick(() => {
    input.value = cnpjFormatado.value
  })
}

// ==========================================
// Upload de Logo
// ==========================================

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) processFile(file)
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

const processFile = (file: File) => {
  logoError.value = ''

  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    logoError.value = 'Formato inválido. Use PNG, JPG ou WebP.'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    logoError.value = 'Arquivo muito grande. Máximo 2MB.'
    return
  }

  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}

const removeLogo = () => {
  logoFile.value = null
  if (logoPreview.value) {
    URL.revokeObjectURL(logoPreview.value)
    logoPreview.value = null
  }
  logoError.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const uploadLogo = async (empresaId: string): Promise<string | null> => {
  if (!logoFile.value) return null

  const ext = logoFile.value.name.split('.').pop()?.toLowerCase() || 'png'
  const fileName = `${empresaId}.${ext}`

  const { error } = await client.storage
    .from('logos')
    .upload(fileName, logoFile.value, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) {
    console.error('Erro upload logo:', error)
    return null
  }

  const { data: urlData } = client.storage
    .from('logos')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

// ==========================================
// Criar Empresa
// ==========================================

const criarPrimeiraEmpresa = async () => {
  if (!nome.value.trim()) return

  try {
    criando.value = true
    const cnpjLimpo = cnpjRaw.value || undefined
    const empresa = await criarEmpresa(nome.value.trim(), cnpjLimpo)

    if (logoFile.value) {
      const logoUrl = await uploadLogo(empresa.id)
      if (logoUrl) {
        await atualizarEmpresa(empresa.id, { logo_url: logoUrl })
      }
    }

    toast.add({
      title: 'Empresa criada!',
      description: 'Tudo pronto. Vamos começar!',
      color: 'green',
      icon: 'i-heroicons-check-circle'
    })

    await navigateTo('/')
  } catch (error: any) {
    toast.add({
      title: 'Erro ao criar empresa',
      description: error.message || 'Tente novamente.',
      color: 'red'
    })
  } finally {
    criando.value = false
  }
}

const logout = async () => {
  await client.auth.signOut()
  await navigateTo('/login')
}

onUnmounted(() => {
  if (logoPreview.value) {
    URL.revokeObjectURL(logoPreview.value)
  }
})
</script>
