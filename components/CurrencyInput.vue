<template>
  <UInput
    :model-value="displayValue"
    @input="onInput"
    @focus="onFocus"
    @blur="onBlur"
    @keydown="onKeydown"
    inputmode="numeric"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue: number | string | undefined | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
  'blur': [event: FocusEvent]
}>()

const displayValue = ref('')

const formatDisplay = (cents: number): string => {
  const value = cents / 100
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

const toCents = (value: number | string | undefined | null): number => {
  const num = Number(value) || 0
  return Math.round(num * 100)
}

const syncFromModel = () => {
  const cents = toCents(props.modelValue)
  displayValue.value = cents === 0 ? '' : formatDisplay(cents)
}

const onInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const rawValue = input.value

  // Extract only digits
  const digits = rawValue.replace(/\D/g, '')

  if (!digits) {
    displayValue.value = ''
    emit('update:modelValue', 0)
    return
  }

  const cents = parseInt(digits, 10)
  displayValue.value = formatDisplay(cents)
  emit('update:modelValue', cents / 100)

  // Restore cursor to end
  nextTick(() => {
    input.setSelectionRange(displayValue.value.length, displayValue.value.length)
  })
}

const onKeydown = (event: KeyboardEvent) => {
  // Allow: backspace, delete, tab, escape, enter, arrows
  const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
  if (allowed.includes(event.key)) return

  // Allow Ctrl/Cmd + A, C, V, X
  if ((event.ctrlKey || event.metaKey) && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) return

  // Block non-numeric
  if (!/^\d$/.test(event.key)) {
    event.preventDefault()
  }
}

const onFocus = (event: FocusEvent) => {
  const input = event.target as HTMLInputElement
  nextTick(() => {
    input.setSelectionRange(input.value.length, input.value.length)
  })
}

const onBlur = (event: FocusEvent) => {
  emit('blur', event)
}

// Sync display when modelValue changes externally
watch(() => props.modelValue, () => {
  syncFromModel()
}, { immediate: true })
</script>
