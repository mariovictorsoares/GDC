<template>
  <UModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :ui="{
      width: 'sm:max-w-lg',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      rounded: 'rounded-lg'
    }"
  >
    <UCard
      :ui="{
        ring: 'ring-0',
        shadow: '',
        divide: 'divide-operacao-100',
        rounded: 'rounded-lg',
        header: { padding: 'px-6 py-4' },
        body: { padding: 'px-6 py-5' },
        footer: { padding: 'px-6 py-4' }
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-guardian-100 rounded-lg">
              <UIcon name="i-heroicons-shopping-cart" class="w-5 h-5 text-guardian-600" />
            </div>
            <h3 class="text-lg font-semibold text-operacao-800">Salvar lista de compras</h3>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="fechar"
          />
        </div>
      </template>

      <div class="space-y-4">
        <!-- Nome da lista -->
        <UFormGroup label="Nome da lista *" required>
          <UInput
            v-model="nome"
            placeholder="Ex: Compras da semana"
            icon="i-heroicons-tag"
            autofocus
          />
        </UFormGroup>

        <!-- Previsao de recebimento -->
        <UFormGroup label="Previsao de recebimento">
          <UInput
            v-model="previsaoRecebimento"
            type="date"
            icon="i-heroicons-calendar-days"
          />
        </UFormGroup>

        <!-- Observacao -->
        <UFormGroup label="Observacao">
          <UTextarea
            v-model="observacao"
            placeholder="Observacoes opcionais..."
            :rows="2"
          />
        </UFormGroup>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton
            color="gray"
            variant="ghost"
            class="w-full sm:w-auto"
            @click="fechar"
          >
            Cancelar
          </UButton>
          <UButton
            color="guardian"
            class="w-full sm:w-auto"
            :disabled="!nome.trim()"
            @click="salvar"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
            Salvar lista
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: { nome: string; previsao_recebimento?: string; observacao?: string }]
}>()

// Form state
const nome = ref('')
const previsaoRecebimento = ref('')
const observacao = ref('')

// Reset form when modal opens
watch(() => props.modelValue, (open) => {
  if (open) {
    nome.value = ''
    previsaoRecebimento.value = ''
    observacao.value = ''
  }
})

const fechar = () => {
  emit('update:modelValue', false)
}

const salvar = () => {
  if (!nome.value.trim()) return

  const data: { nome: string; previsao_recebimento?: string; observacao?: string } = {
    nome: nome.value.trim()
  }

  if (previsaoRecebimento.value) {
    data.previsao_recebimento = previsaoRecebimento.value
  }

  if (observacao.value.trim()) {
    data.observacao = observacao.value.trim()
  }

  emit('save', data)
  fechar()
}
</script>
