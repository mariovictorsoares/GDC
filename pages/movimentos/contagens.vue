<template>
  <div class="p-6 space-y-4">
    <!-- View: Detalhes -->
    <div v-if="contagemSelecionada">
      <!-- Header com voltar -->
      <div class="flex items-center gap-3 mb-4">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          color="gray"
          @click="contagemSelecionada = null"
        />
        <div>
          <h1 class="text-xl font-semibold text-gray-900">{{ contagemSelecionada.nome }}</h1>
          <p class="text-sm text-gray-500">{{ formatarData(contagemSelecionada.data) }}</p>
        </div>
        <UBadge :color="statusColor(contagemSelecionada.status)" class="ml-2">
          {{ statusLabel(contagemSelecionada.status) }}
        </UBadge>
      </div>

      <!-- Contagem Em Andamento / Pendente -->
      <div v-if="contagemSelecionada.status !== 'finalizada'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Progresso por setor -->
          <UCard v-for="cs in contagemSelecionada.contagem_setores" :key="cs.id">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium text-sm">{{ cs.setor?.nome || 'Setor' }}</span>
              <span class="text-xs text-gray-500">{{ cs.progresso || 0 }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div
                class="bg-guardian-500 h-2 rounded-full transition-all"
                :style="{ width: `${cs.progresso || 0}%` }"
              />
            </div>
          </UCard>
        </div>

        <!-- Ações -->
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-link"
            variant="outline"
            size="sm"
            @click="copiarLink(contagemSelecionada.token)"
          >
            Copiar Link
          </UButton>
          <UButton
            v-if="contagemSelecionada.responsavel_telefone"
            icon="i-heroicons-chat-bubble-left"
            variant="outline"
            size="sm"
            color="green"
            @click="enviarLembrete(contagemSelecionada)"
          >
            Enviar Lembrete
          </UButton>
        </div>
      </div>

      <!-- Contagem Finalizada: Revisão -->
      <div v-else>
        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Contados</p>
            <p class="text-2xl font-bold">{{ kpis.contados }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Divergências</p>
            <p class="text-2xl font-bold text-amber-600">{{ kpis.divergencias }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Sobras</p>
            <p class="text-2xl font-bold text-green-600">{{ kpis.sobras }}</p>
          </UCard>
          <UCard>
            <p class="text-xs text-gray-500 uppercase">Faltas</p>
            <p class="text-2xl font-bold text-red-600">{{ kpis.faltas }}</p>
          </UCard>
        </div>

        <!-- Tabela de divergências por setor -->
        <div v-for="setor in setoresRevisao" :key="setor.id" class="mb-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-2">
            {{ setor.nome }}
            <span class="text-xs font-normal text-gray-400 ml-1">({{ setor.tipo === 'apoio' ? 'Apoio' : 'Principal' }})</span>
          </h3>
          <UTable
            :rows="setor.itens"
            :columns="colunasRevisao"
          >
            <template #diferenca-data="{ row }">
              <span :class="row.diferenca > 0 ? 'text-green-600' : row.diferenca < 0 ? 'text-red-600' : 'text-gray-400'">
                {{ row.diferenca > 0 ? '+' : '' }}{{ row.diferenca }}
              </span>
            </template>
            <template #acao-data="{ row }">
              <UBadge v-if="row.ajuste_registrado" color="green" variant="subtle">Ajustado</UBadge>
              <UButton
                v-else-if="row.diferenca !== 0"
                size="xs"
                variant="soft"
                @click="registrarAjusteIndividual(row)"
                :loading="ajustandoIds.has(row.produto_id)"
              >
                Ajustar
              </UButton>
              <span v-else class="text-xs text-gray-400">—</span>
            </template>
          </UTable>
        </div>

        <!-- Botão registrar todos -->
        <div v-if="temDivergenciasPendentes" class="flex justify-end">
          <UButton
            color="primary"
            :loading="ajustandoTodos"
            @click="registrarTodosAjustes"
          >
            Registrar Todos os Ajustes
          </UButton>
        </div>
      </div>
    </div>

    <!-- View: Lista -->
    <div v-else>
      <h1 class="text-xl font-semibold text-gray-900 mb-4">Contagens</h1>

      <!-- Toolbar -->
      <div class="flex items-center gap-3 mb-4">
        <UInput
          v-model="filtroNome"
          icon="i-heroicons-magnifying-glass"
          placeholder="Buscar contagem..."
          size="sm"
          class="w-64"
        />
        <USelect
          v-model="filtroStatus"
          :options="opcoesStatus"
          size="sm"
          class="w-40"
        />
        <div class="flex-1" />
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          size="sm"
          @click="abrirCriacao"
        >
          Nova Contagem
        </UButton>
      </div>

      <!-- Tabela -->
      <UTable
        :rows="contagensFiltradas"
        :columns="colunasLista"
        :loading="carregando"
        @select="selecionarContagem"
        class="cursor-pointer"
      >
        <template #status-data="{ row }">
          <UBadge :color="statusColor(row.status)" variant="subtle">
            {{ statusLabel(row.status) }}
          </UBadge>
          <UBadge v-if="row.status === 'finalizada' && isAjustado(row)" color="green" variant="subtle" class="ml-1">
            Ajustado
          </UBadge>
        </template>
        <template #acoes-data="{ row }">
          <div class="flex gap-1" @click.stop>
            <UTooltip text="Copiar link">
              <UButton
                icon="i-heroicons-link"
                variant="ghost"
                color="gray"
                size="xs"
                @click="copiarLink(row.token)"
              />
            </UTooltip>
            <UTooltip text="Editar">
              <UButton
                icon="i-heroicons-pencil"
                variant="ghost"
                color="gray"
                size="xs"
                @click="abrirEdicao(row)"
              />
            </UTooltip>
            <UTooltip text="Excluir">
              <UButton
                icon="i-heroicons-trash"
                variant="ghost"
                color="red"
                size="xs"
                @click="confirmarExclusao(row)"
              />
            </UTooltip>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Modais existentes -->
    <ContagemEditarModal
      v-if="modalEditar"
      :contagem="contagemEditando"
      @close="modalEditar = false"
      @saved="onContagemSalva"
    />
  </div>
</template>

<script setup lang="ts">
import type { Contagem, ContagemItemDB, SaldoEstoque } from '~/types'

const toast = useToast()
const { getContagens, deleteContagem, getSaldoEstoque, createAjustesEmLote, markContagemItensAjustados, getContagemItens, updateContagemStatus } = useEstoque()

// Calcula semana no formato usado pelo sistema (ex: "SEMANA 1")
const calcularSemana = (dataStr: string): string => {
  const d = new Date(dataStr + 'T00:00:00')
  const dia = d.getDate()
  const semanaNum = Math.ceil(dia / 7)
  return `SEMANA ${semanaNum}`
}

// Estado da lista
const contagens = ref<Contagem[]>([])
const carregando = ref(false)
const filtroNome = ref('')
const filtroStatus = ref('todos')
const contagemSelecionada = ref<Contagem | null>(null)

// Estado da revisão
const itensRevisao = ref<ContagemItemDB[]>([])
const saldos = ref<SaldoEstoque[]>([])
const ajustandoIds = ref(new Set<string>())
const ajustandoTodos = ref(false)

// Estado de modais
const modalEditar = ref(false)
const contagemEditando = ref<Contagem | null>(null)

const opcoesStatus = [
  { label: 'Todos', value: 'todos' },
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Pendente', value: 'pendente' },
  { label: 'Em andamento', value: 'em_andamento' },
  { label: 'Finalizada', value: 'finalizada' }
]

const colunasLista = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'data', label: 'Data', sortable: true },
  { key: 'responsavel_nome', label: 'Responsável' },
  { key: 'status', label: 'Status' },
  { key: 'acoes', label: '' }
]

const colunasRevisao = [
  { key: 'produto_nome', label: 'Produto' },
  { key: 'saldo_sistema', label: 'Sistema' },
  { key: 'quantidade_contada', label: 'Contado' },
  { key: 'diferenca', label: 'Dif' },
  { key: 'acao', label: '' }
]

// Carregar dados
const carregarContagens = async () => {
  carregando.value = true
  try {
    contagens.value = await getContagens()
    await checarStatusAjustado()
  } finally {
    carregando.value = false
  }
}

onMounted(carregarContagens)

// Filtro
const contagensFiltradas = computed(() => {
  let lista = contagens.value
  if (filtroNome.value) {
    const term = filtroNome.value.toLowerCase()
    lista = lista.filter(c => c.nome.toLowerCase().includes(term))
  }
  if (filtroStatus.value !== 'todos') {
    lista = lista.filter(c => c.status === filtroStatus.value)
  }
  return lista
})

// Formatação
const formatarData = (data?: string) => {
  if (!data) return ''
  return new Date(data + 'T00:00:00').toLocaleDateString('pt-BR')
}

const statusColor = (status: string) => {
  const map: Record<string, string> = {
    aguardando: 'blue',
    pendente: 'yellow',
    atrasada: 'red',
    em_andamento: 'orange',
    finalizada: 'green'
  }
  return map[status] || 'gray'
}

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    aguardando: 'Aguardando',
    pendente: 'Pendente',
    atrasada: 'Atrasada',
    em_andamento: 'Em andamento',
    finalizada: 'Finalizada'
  }
  return map[status] || status
}

// Seleção de contagem
const selecionarContagem = async (row: Contagem) => {
  contagemSelecionada.value = row

  if (row.status === 'finalizada') {
    // Carregar itens + saldos para revisão
    const [itens, saldoData] = await Promise.all([
      getContagemItens(row.id),
      getSaldoEstoque()
    ])
    itensRevisao.value = itens
    saldos.value = saldoData
  }
}

// Dados de revisão
const setoresRevisao = computed(() => {
  if (!contagemSelecionada.value?.contagem_setores) return []
  const saldoMap = new Map(saldos.value.map(s => [s.produto_id, s]))

  return contagemSelecionada.value.contagem_setores.map(cs => {
    const setorTipo = (cs.setor as any)?.tipo || 'principal'
    const itensDoSetor = itensRevisao.value.filter(i => i.setor_id === cs.setor_id)

    return {
      id: cs.setor_id,
      nome: cs.setor?.nome || '',
      tipo: setorTipo,
      itens: itensDoSetor.map(item => {
        const saldo = saldoMap.get(item.produto_id)
        const saldoSistema = item.saldo_no_momento ??
          (setorTipo === 'apoio' ? (saldo?.saldo_apoio || 0) : (saldo?.saldo_principal || 0))
        const diferenca = (item.quantidade_contada ?? 0) - saldoSistema

        return {
          produto_id: item.produto_id,
          produto_nome: saldo?.produto || item.produto_id,
          saldo_sistema: saldoSistema,
          quantidade_contada: item.quantidade_contada,
          diferenca,
          ajuste_registrado: item.ajuste_registrado
        }
      })
    }
  })
})

const kpis = computed(() => {
  const todosItens = setoresRevisao.value.flatMap(s => s.itens)
  return {
    contados: todosItens.length,
    divergencias: todosItens.filter(i => i.diferenca !== 0).length,
    sobras: todosItens.filter(i => i.diferenca > 0).length,
    faltas: todosItens.filter(i => i.diferenca < 0).length
  }
})

const temDivergenciasPendentes = computed(() => {
  return setoresRevisao.value.some(s =>
    s.itens.some(i => i.diferenca !== 0 && !i.ajuste_registrado)
  )
})

// Cache de status "ajustado" por contagem (carregado sob demanda)
const ajustadoCache = ref<Record<string, boolean>>({})

const isAjustado = (contagem: Contagem) => {
  return ajustadoCache.value[contagem.id] || false
}

// Ao carregar contagens, checar quais finalizadas tem todos ajustes feitos
const checarStatusAjustado = async () => {
  const finalizadas = contagens.value.filter(c => c.status === 'finalizada')
  for (const c of finalizadas) {
    const itens = await getContagemItens(c.id)
    const comDivergencia = itens.filter(i =>
      i.quantidade_contada !== null && i.saldo_no_momento !== null &&
      i.quantidade_contada !== i.saldo_no_momento
    )
    ajustadoCache.value[c.id] = comDivergencia.length > 0 &&
      comDivergencia.every(i => i.ajuste_registrado)
  }
}

// Ações
const copiarLink = (token?: string) => {
  if (!token) return
  const url = `https://www.cmv360app.com.br/contagem/${token}`
  navigator.clipboard.writeText(url)
  toast.add({ title: 'Link copiado!', color: 'green' })
}

const enviarLembrete = async (contagem: Contagem) => {
  if (!contagem.responsavel_telefone || !contagem.responsavel_nome) return
  try {
    const mensagem = [
      `📋 *Lembrete de Contagem*`,
      ``,
      `Olá, *${contagem.responsavel_nome}*!`,
      `Está na hora de realizar a contagem:`,
      ``,
      `📌 *${contagem.nome}*`,
      ``,
      `👉 *Acesse e inicie a contagem:*`,
      `https://www.cmv360app.com.br/contagem/${contagem.token}`
    ].join('\n')

    await $fetch('/api/whatsapp/enviar', {
      method: 'POST',
      body: { phone: contagem.responsavel_telefone, message: mensagem }
    })
    toast.add({ title: 'Lembrete enviado!', color: 'green' })
  } catch {
    toast.add({ title: 'Erro ao enviar lembrete', color: 'red' })
  }
}

const registrarAjusteIndividual = async (item: any) => {
  if (!contagemSelecionada.value || item.diferenca === 0) return
  ajustandoIds.value.add(item.produto_id)

  try {
    const hoje = new Date().toISOString().split('T')[0]
    const semana = calcularSemana(hoje)
    await createAjustesEmLote([{
      produto_id: item.produto_id,
      data: hoje,
      semana,
      quantidade: item.diferenca,
      motivo: `Contagem: ${contagemSelecionada.value.nome}`,
      contagem_id: contagemSelecionada.value.id
    }])
    await markContagemItensAjustados(contagemSelecionada.value.id, [item.produto_id])
    item.ajuste_registrado = true
    toast.add({ title: 'Ajuste registrado', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  } finally {
    ajustandoIds.value.delete(item.produto_id)
  }
}

const registrarTodosAjustes = async () => {
  if (!contagemSelecionada.value) return
  ajustandoTodos.value = true

  try {
    const hoje = new Date().toISOString().split('T')[0]
    const pendentes = setoresRevisao.value
      .flatMap(s => s.itens)
      .filter(i => i.diferenca !== 0 && !i.ajuste_registrado)

    if (!pendentes.length) return

    const semana = calcularSemana(hoje)
    await createAjustesEmLote(pendentes.map(i => ({
      produto_id: i.produto_id,
      data: hoje,
      semana,
      quantidade: i.diferenca,
      motivo: `Contagem: ${contagemSelecionada.value!.nome}`,
      contagem_id: contagemSelecionada.value!.id
    })))

    await markContagemItensAjustados(
      contagemSelecionada.value.id,
      pendentes.map(i => i.produto_id)
    )

    // Atualizar UI
    for (const s of setoresRevisao.value) {
      for (const i of s.itens) {
        if (i.diferenca !== 0) i.ajuste_registrado = true
      }
    }

    toast.add({ title: 'Todos os ajustes registrados!', color: 'green' })
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  } finally {
    ajustandoTodos.value = false
  }
}

const abrirCriacao = () => {
  contagemEditando.value = null
  modalEditar.value = true
}

const abrirEdicao = (contagem: Contagem) => {
  contagemEditando.value = contagem
  modalEditar.value = true
}

const onContagemSalva = () => {
  modalEditar.value = false
  carregarContagens()
}

const confirmarExclusao = async (contagem: Contagem) => {
  if (!confirm(`Excluir contagem "${contagem.nome}"?`)) return
  try {
    await deleteContagem(contagem.id)
    toast.add({ title: 'Contagem excluída', color: 'green' })
    carregarContagens()
  } catch (e: any) {
    toast.add({ title: 'Erro', description: e.message, color: 'red' })
  }
}
</script>
