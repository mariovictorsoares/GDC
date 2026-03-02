<template>
  <UModal
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :ui="{
      width: 'sm:max-w-md',
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
            <div class="p-2 bg-controle-100 rounded-lg">
              <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-controle-600" />
            </div>
            <h3 class="text-lg font-semibold text-operacao-800">Confirmar Recebimento</h3>
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
        <p class="text-operacao-600">
          Confirmar o recebimento da lista
          "<span class="font-semibold text-operacao-800">{{ pedido?.nome || 'Sem nome' }}</span>"?
        </p>

        <UFormGroup label="Data do recebimento">
          <UInput
            v-model="dataRecebimento"
            type="date"
            icon="i-heroicons-calendar-days"
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
            @click="confirmar"
          >
            <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
            Confirmar Recebimento
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Pedido } from '~/types'

const props = defineProps<{
  modelValue: boolean
  pedido: Pedido | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': [dataRecebimento: string]
}>()

// Default to today's date
const dataRecebimento = ref(new Date().toISOString().split('T')[0])

// Reset date when modal opens
watch(() => props.modelValue, (open) => {
  if (open) {
    dataRecebimento.value = new Date().toISOString().split('T')[0]
  }
})

const fechar = () => {
  emit('update:modelValue', false)
}

const confirmar = () => {
  emit('confirm', dataRecebimento.value)
  fechar()
}
</script>
