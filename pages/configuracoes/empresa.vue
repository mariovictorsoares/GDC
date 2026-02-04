<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Configurações da Empresa</h1>
        <p class="text-sm text-gray-500">Configurações gerais do sistema</p>
      </div>
    </div>

    <!-- Formulário -->
    <UCard>
      <form @submit.prevent="saveConfiguracoes" class="space-y-6">
        <UFormGroup label="Seu Nome">
          <UInput
            v-model="form.nome_usuario"
            placeholder="Digite seu nome"
            size="lg"
          />
          <template #hint>
            Este nome será usado na saudação do sistema
          </template>
        </UFormGroup>

        <UFormGroup label="Nome da Empresa">
          <UInput
            v-model="form.nome_empresa"
            placeholder="Nome da empresa"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="Ano Base">
          <USelect
            v-model="form.ano_base"
            :options="anosOptions"
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="Meta de CMV (%)">
          <UInput
            v-model.number="form.meta_cmv"
            type="number"
            step="0.01"
            min="0"
            max="100"
            placeholder="35"
            size="lg"
          />
          <template #hint>
            Percentual máximo aceitável de CMV sobre o faturamento
          </template>
        </UFormGroup>

        <div class="flex justify-end">
          <UButton
            type="submit"
            color="primary"
            size="lg"
            :loading="saving"
          >
            <UIcon name="i-heroicons-check" class="w-5 h-5 mr-2" />
            Salvar Configurações
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">

const { getConfiguracoes, setConfiguracao } = useEstoque()
const toast = useToast()

const saving = ref(false)
const form = ref({
  nome_usuario: '',
  nome_empresa: '',
  ano_base: new Date().getFullYear().toString(),
  meta_cmv: 35
})

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 10 }, (_, i) => ({
    label: String(currentYear - 5 + i),
    value: String(currentYear - 5 + i)
  }))
})

const loadConfiguracoes = async () => {
  try {
    const configs = await getConfiguracoes()
    configs.forEach(config => {
      if (config.chave === 'nome_usuario') {
        form.value.nome_usuario = config.valor
      } else if (config.chave === 'nome_empresa') {
        form.value.nome_empresa = config.valor
      } else if (config.chave === 'ano_base') {
        form.value.ano_base = config.valor
      } else if (config.chave === 'meta_cmv') {
        form.value.meta_cmv = parseFloat(config.valor) * 100
      }
    })
  } catch (error) {
    console.error('Erro ao carregar configurações:', error)
  }
}

const saveConfiguracoes = async () => {
  try {
    saving.value = true

    await Promise.all([
      setConfiguracao('nome_usuario', form.value.nome_usuario),
      setConfiguracao('nome_empresa', form.value.nome_empresa),
      setConfiguracao('ano_base', form.value.ano_base),
      setConfiguracao('meta_cmv', String(form.value.meta_cmv / 100))
    ])

    toast.add({
      title: 'Sucesso',
      description: 'Configurações salvas com sucesso',
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar configurações',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfiguracoes()
})
</script>
