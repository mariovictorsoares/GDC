<template>
  <div class="inline-block" ref="triggerRef" @mouseenter="onEnter" @mouseleave="onLeave">
    <span class="cursor-default underline decoration-dotted underline-offset-2">
      <slot />
    </span>
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="show"
          class="fixed z-[9999] pointer-events-none"
          :style="floatingStyle"
        >
          <div class="bg-white rounded-lg shadow-lg border border-gray-200 p-2.5 w-[196px]">
            <!-- Mês / Ano -->
            <div class="text-center text-[10px] font-semibold text-gray-700 mb-1.5">
              {{ nomeMes }} {{ ano }}
            </div>
            <!-- Dias da semana header -->
            <div class="grid grid-cols-7 gap-0">
              <div
                v-for="dia in diasSemanaHeader"
                :key="dia"
                class="text-[9px] font-medium text-gray-400 text-center leading-5"
              >
                {{ dia }}
              </div>
              <!-- Células do calendário -->
              <div
                v-for="(cell, idx) in calendarCells"
                :key="'c-' + idx"
                class="text-[10px] text-center leading-5 rounded"
                :class="cellClass(cell)"
              >
                {{ cell.dia || '' }}
              </div>
            </div>
          </div>
          <!-- Seta -->
          <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Props {
  mes: number
  ano: number
  diaInicio: number
  diaFim: number
}

const props = defineProps<Props>()
const show = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const floatingStyle = ref<Record<string, string>>({})

const updatePosition = () => {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const calWidth = 196
  let left = rect.left + rect.width / 2 - calWidth / 2
  // Evitar sair da tela pela esquerda/direita
  if (left < 8) left = 8
  if (left + calWidth > window.innerWidth - 8) left = window.innerWidth - calWidth - 8
  floatingStyle.value = {
    left: `${left}px`,
    top: `${rect.top - 8}px`,
    transform: 'translateY(-100%)'
  }
}

const onEnter = () => {
  updatePosition()
  show.value = true
}

const onLeave = () => {
  show.value = false
}

const nomeMes = computed(() => {
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return nomes[props.mes - 1]
})

const diasSemanaHeader = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface CalendarCell {
  dia: number | null
  highlighted: boolean
  today: boolean
}

const calendarCells = computed((): CalendarCell[] => {
  const primeiroDia = new Date(props.ano, props.mes - 1, 1)
  const totalDias = new Date(props.ano, props.mes, 0).getDate()

  // getDay: 0=dom, 1=seg... Converter para seg=0
  let startOffset = primeiroDia.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const hoje = new Date()
  const isCurrentMonth = hoje.getFullYear() === props.ano && hoje.getMonth() + 1 === props.mes
  const diaHoje = hoje.getDate()

  const cells: CalendarCell[] = []

  // Células vazias antes do dia 1
  for (let i = 0; i < startOffset; i++) {
    cells.push({ dia: null, highlighted: false, today: false })
  }

  // Dias do mês
  for (let d = 1; d <= totalDias; d++) {
    cells.push({
      dia: d,
      highlighted: d >= props.diaInicio && d <= props.diaFim,
      today: isCurrentMonth && d === diaHoje
    })
  }

  return cells
})

const cellClass = (cell: CalendarCell) => {
  if (!cell.dia) return ''
  if (cell.today && cell.highlighted) return 'bg-primary-600 text-white font-bold ring-1 ring-primary-400'
  if (cell.highlighted) return 'bg-primary-100 text-primary-700 font-semibold'
  if (cell.today) return 'font-bold text-primary-600 ring-1 ring-primary-300 rounded-full'
  return 'text-gray-500'
}
</script>
