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
              {{ nomeMes }} {{ anoExibicao }}
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
                {{ cell.dia }}
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
  dataInicio: string  // ISO: "2026-01-26"
  dataFim: string     // ISO: "2026-02-01"
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

const anoExibicao = computed(() => props.ano)
const nomeMes = computed(() => {
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return nomes[props.mes - 1]
})

const diasSemanaHeader = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const toISO = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface CalendarCell {
  dia: number
  iso: string
  highlighted: boolean
  today: boolean
  outOfMonth: boolean  // dia pertence a outro mês
}

const calendarCells = computed((): CalendarCell[] => {
  const primeiroDia = new Date(props.ano, props.mes - 1, 1)
  const totalDias = new Date(props.ano, props.mes, 0).getDate()

  // getDay: 0=dom, 1=seg... Converter para seg=0
  let startOffset = primeiroDia.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const hoje = new Date()
  const hojeISO = toISO(hoje)

  const inicioISO = props.dataInicio
  const fimISO = props.dataFim

  const cells: CalendarCell[] = []

  // Dias do mês anterior para preencher o início
  const diasMesAnterior = new Date(props.ano, props.mes - 1, 0).getDate()
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = diasMesAnterior - i
    const date = new Date(props.ano, props.mes - 2, d)
    const iso = toISO(date)
    cells.push({
      dia: d,
      iso,
      highlighted: iso >= inicioISO && iso <= fimISO,
      today: iso === hojeISO,
      outOfMonth: true
    })
  }

  // Dias do mês atual
  for (let d = 1; d <= totalDias; d++) {
    const iso = `${props.ano}-${String(props.mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({
      dia: d,
      iso,
      highlighted: iso >= inicioISO && iso <= fimISO,
      today: iso === hojeISO,
      outOfMonth: false
    })
  }

  // Dias do próximo mês para completar a última linha
  const totalCells = cells.length
  const remainder = totalCells % 7
  if (remainder > 0) {
    const diasParaCompletar = 7 - remainder
    for (let d = 1; d <= diasParaCompletar; d++) {
      const date = new Date(props.ano, props.mes, d)
      const iso = toISO(date)
      cells.push({
        dia: d,
        iso,
        highlighted: iso >= inicioISO && iso <= fimISO,
        today: iso === hojeISO,
        outOfMonth: true
      })
    }
  }

  return cells
})

const cellClass = (cell: CalendarCell) => {
  if (cell.today && cell.highlighted) return 'bg-primary-600 text-white font-bold ring-1 ring-primary-400'
  if (cell.highlighted && cell.outOfMonth) return 'bg-primary-50 text-primary-400 font-medium'
  if (cell.highlighted) return 'bg-primary-100 text-primary-700 font-semibold'
  if (cell.today) return 'font-bold text-primary-600 ring-1 ring-primary-300 rounded-full'
  if (cell.outOfMonth) return 'text-gray-300'
  return 'text-gray-500'
}
</script>
