<template>
  <UModal
    :model-value="modelValue"
    :ui="{
      width: 'sm:max-w-4xl w-full',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
      shadow: 'shadow-2xl'
    }"
    :fullscreen="isMobile"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <UCard
      :ui="{
        background: 'bg-transparent',
        ring: 'ring-0',
        shadow: '',
        divide: 'divide-operacao-100 dark:divide-operacao-700',
        body: { padding: 'px-4 py-4 sm:px-6 sm:py-5' },
        header: { padding: 'px-4 py-3 sm:px-6 sm:py-4' },
        footer: { padding: 'px-4 py-3 sm:px-6 sm:py-4' }
      }"
    >
      <!-- Header -->
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-operacao-800 dark:text-white">
              {{ contagem?.nome || 'Contagem' }}
            </h3>
            <p class="text-sm text-operacao-400 mt-0.5">
              Acompanhe o progresso da contagem
            </p>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            size="sm"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </template>

      <!-- Body -->
      <div class="space-y-6">
        <!-- Responsaveis info bar -->
        <div
          v-if="responsaveisDisplay.length > 0"
          class="flex items-center gap-3 rounded-lg bg-operacao-50 dark:bg-operacao-700/30 px-4 py-3"
        >
          <UIcon name="i-heroicons-user-circle" class="w-5 h-5 text-operacao-400 flex-shrink-0" />
          <div class="flex flex-col gap-1 text-sm">
            <div v-for="(resp, idx) in responsaveisDisplay" :key="idx" class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span class="text-operacao-800 dark:text-white font-medium">
                {{ responsaveisDisplay.length === 1 ? 'Responsável' : '' }} {{ resp.nome }}
              </span>
              <span v-if="resp.telefone" class="text-operacao-400 flex items-center gap-1">
                <UIcon name="i-heroicons-phone" class="w-3.5 h-3.5" />
                {{ resp.telefone }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action buttons row -->
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <UButton
            color="green"
            :disabled="!todosFinalizados"
            class="w-full sm:w-auto"
            @click="$emit('finalizar')"
          >
            <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1.5" />
            Finalizar Contagem
          </UButton>
          <UButton
            color="gray"
            size="sm"
            variant="soft"
            class="w-full sm:w-auto"
            @click="$emit('reiniciar')"
          >
            <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1.5" />
            Reiniciar Contagem
          </UButton>
          <UButton
            color="red"
            size="sm"
            variant="outline"
            class="w-full sm:w-auto"
            @click="$emit('cancelar')"
          >
            <UIcon name="i-heroicons-x-circle" class="w-4 h-4 mr-1.5" />
            Cancelar Contagem
          </UButton>
        </div>

        <!-- Section header -->
        <div>
          <div class="flex items-center gap-3 mb-1">
            <h4 class="text-base font-semibold text-operacao-800 dark:text-white">
              Progresso
            </h4>
            <span
              v-if="contagem?.contagem_setores?.length"
              class="text-xs font-medium px-2 py-0.5 rounded-full"
              :class="progressoGeral >= 100
                ? 'bg-controle-100 text-controle-700 dark:bg-controle-900/30 dark:text-controle-400'
                : progressoGeral > 0
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-operacao-100 text-operacao-400 dark:bg-operacao-700 dark:text-operacao-400'"
            >
              {{ Math.round(progressoGeral) }}% geral
            </span>
          </div>
          <p class="text-sm text-operacao-400">
            Acompanhe o progresso da contagem de cada setor.
          </p>
        </div>

        <!-- Sector cards grid -->
        <div
          v-if="contagem?.contagem_setores?.length"
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <UCard
            v-for="setorRel in contagem.contagem_setores"
            :key="setorRel.id"
            :ui="{
              background: 'bg-white dark:bg-operacao-700/40',
              ring: 'ring-1 ring-[#EBEBED] dark:ring-operacao-600',
              shadow: 'shadow-sm',
              body: { padding: 'px-4 py-4' }
            }"
          >
            <div class="flex flex-col items-center text-center gap-3">
              <!-- Sector name -->
              <h5 class="text-sm font-bold text-operacao-800 dark:text-white truncate w-full">
                {{ setorRel.setor?.nome || 'Setor' }}
              </h5>

              <!-- Circular progress -->
              <CircularProgress
                :value="setorRel.progresso || 0"
                :size="70"
              />

              <!-- Progress text -->
              <p class="text-xs text-operacao-400">
                Progresso: {{ Math.round(setorRel.progresso || 0) }}%
              </p>

              <!-- Action button based on state -->
              <UButton
                v-if="(setorRel.progresso || 0) >= 100"
                color="green"
                variant="soft"
                size="sm"
                disabled
                class="w-full"
              >
                <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1" />
                Concluído
              </UButton>
              <UButton
                v-else-if="(setorRel.progresso || 0) > 0"
                color="amber"
                size="sm"
                class="w-full"
                @click="$emit('iniciar-setor', setorRel.setor, setorRel)"
              >
                <UIcon name="i-heroicons-play" class="w-4 h-4 mr-1" />
                Continuar
              </UButton>
              <UButton
                v-else
                color="primary"
                size="sm"
                class="w-full"
                @click="$emit('iniciar-setor', setorRel.setor, setorRel)"
              >
                <UIcon name="i-heroicons-clipboard-document-list" class="w-4 h-4 mr-1" />
                Contar
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="flex flex-col items-center justify-center py-12 text-operacao-400"
        >
          <UIcon name="i-heroicons-clipboard-document-list" class="w-10 h-10 mb-3" />
          <p class="text-sm font-medium">Nenhum setor configurado</p>
          <p class="text-xs">Adicione setores a esta contagem para iniciar.</p>
        </div>
      </div>

      <!-- Footer -->
      <template #footer>
        <div class="flex items-center gap-2 text-xs text-operacao-400">
          <UIcon name="i-heroicons-light-bulb" class="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span>
            Não se esqueça de clicar em <strong class="text-operacao-800 dark:text-white">Finalizar Contagem</strong>
            assim que todos os produtos forem contados!
          </span>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Contagem, ContagemSetorRel } from '~/types'

const props = defineProps<{
  modelValue: boolean
  contagem: Contagem | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'iniciar-setor': [setor: any, setorRel: ContagemSetorRel]
  'finalizar': []
  'reiniciar': []
  'cancelar': []
}>()

// Responsive: detect mobile for fullscreen modal
const isMobile = ref(false)

onMounted(() => {
  const checkMobile = () => {
    isMobile.value = window.innerWidth < 640
  }
  checkMobile()
  window.addEventListener('resize', checkMobile)
  onUnmounted(() => window.removeEventListener('resize', checkMobile))
})

// Responsáveis display (array ou fallback para campo legado)
const responsaveisDisplay = computed(() => {
  if (props.contagem?.responsaveis_data && props.contagem.responsaveis_data.length > 0) {
    return props.contagem.responsaveis_data as Array<{ nome: string; telefone: string }>
  }
  if (props.contagem?.responsavel_nome) {
    return [{ nome: props.contagem.responsavel_nome, telefone: props.contagem.responsavel_telefone || '' }]
  }
  return []
})

// All sectors finished (progresso >= 100)
const todosFinalizados = computed(() => {
  const setores = props.contagem?.contagem_setores
  if (!setores || setores.length === 0) return false
  return setores.every(s => (s.progresso || 0) >= 100)
})

// Average progress across all sectors
const progressoGeral = computed(() => {
  const setores = props.contagem?.contagem_setores
  if (!setores || setores.length === 0) return 0
  const soma = setores.reduce((acc, s) => acc + (s.progresso || 0), 0)
  return soma / setores.length
})
</script>
