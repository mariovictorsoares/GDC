<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-b-lg">
    <!-- Esquerda: Seletor de linhas + Total de registros -->
    <div class="flex items-center gap-3">
      <USelect
        v-model="internalPageSize"
        :options="pageSizeOptions"
        size="sm"
        class="w-28"
      />
      <span class="text-sm text-gray-600">
        {{ totalItems }} registros encontrados
      </span>
    </div>

    <!-- Direita: Navegacao de paginas -->
    <div class="flex items-center gap-2">
      <UButton
        icon="i-heroicons-chevron-left"
        variant="ghost"
        color="gray"
        size="sm"
        :disabled="modelValue === 1"
        @click="prevPage"
      />
      <span class="text-sm text-gray-600">Página</span>
      <UInput
        v-model="pageInput"
        type="number"
        size="sm"
        class="w-14"
        :ui="{ base: 'text-center' }"
        @blur="validateAndGoToPage"
        @keyup.enter="validateAndGoToPage"
      />
      <span class="text-sm text-gray-600">de {{ totalPages }}</span>
      <UButton
        icon="i-heroicons-chevron-right"
        variant="ghost"
        color="gray"
        size="sm"
        :disabled="modelValue >= totalPages"
        @click="nextPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  pageSize: number
  totalItems: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'update:pageSize': [value: number]
}>()

const pageSizeOptions = [
  { label: '10 linhas', value: 10 },
  { label: '20 linhas', value: 20 },
  { label: '50 linhas', value: 50 },
  { label: '100 linhas', value: 100 }
]

const pageInput = ref(String(props.modelValue))

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.totalItems / props.pageSize))
})

// Sincroniza o input quando o modelValue muda externamente
watch(() => props.modelValue, (newVal) => {
  pageInput.value = String(newVal)
})

const internalPageSize = computed({
  get: () => props.pageSize,
  set: (value: number) => {
    emit('update:pageSize', value)
    emit('update:modelValue', 1)
  }
})

const prevPage = () => {
  if (props.modelValue > 1) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

const nextPage = () => {
  if (props.modelValue < totalPages.value) {
    emit('update:modelValue', props.modelValue + 1)
  }
}

const validateAndGoToPage = () => {
  let page = parseInt(pageInput.value, 10)

  // Corrige valores inválidos
  if (isNaN(page) || page < 1) {
    page = 1
  } else if (page > totalPages.value) {
    page = totalPages.value
  }

  // Atualiza o input com o valor corrigido
  pageInput.value = String(page)

  // Emite apenas se mudou
  if (page !== props.modelValue) {
    emit('update:modelValue', page)
  }
}
</script>
