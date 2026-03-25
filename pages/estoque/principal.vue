<template>
  <div class="space-y-6">

    <!-- Header + Ações -->
    <div class="flex items-center justify-between pb-4">
      <h1 class="text-2xl font-semibold text-[#5a5a66]">Estoque Principal</h1>
      <div class="flex gap-2 flex-shrink-0">
        <UButton v-if="pendentesTransfCount > 0" color="white" :ui="toolbarButtonUi" @click="showPendentesTransf = true">
          <UIcon name="i-heroicons-truck" class="w-4 h-4 mr-1.5 text-operacao-400" />
          Transferências
          <span class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none rounded-full bg-blue-500 text-white">{{ pendentesTransfCount }}</span>
        </UButton>
        <button class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 hover:shadow-md active:bg-emerald-700 transition-all duration-150" @click="openEntradaModal()">
          <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
          Entrada
        </button>
        <button class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium rounded-lg bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md active:bg-red-700 transition-all duration-150" @click="openSaidaModal()">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4" />
          Saída
        </button>
      </div>
    </div>

    <!-- Barra: Tabs + Filtros -->
    <div class="flex items-end justify-between">
      <!-- Tabs -->
      <div ref="tabsContainerRef" class="relative flex items-center gap-0.5">
        <button v-for="v in viewModeOptions" :key="v.key" :ref="el => { if (el) tabRefs[v.key] = el as HTMLElement }" @click="viewMode = v.key as any"
          class="relative flex items-center gap-1.5 px-3.5 pb-2.5 pt-1 text-sm font-medium transition-colors duration-200"
          :class="viewMode === v.key ? 'text-guardian-700' : 'text-operacao-400 hover:text-operacao-600'">
          <UIcon :name="v.icon" class="w-4 h-4" />
          <span>{{ v.label }}</span>
        </button>
        <!-- Sliding indicator -->
        <span class="absolute bottom-0 h-[2px] bg-guardian-600 rounded-full transition-all duration-300 ease-in-out" :style="tabIndicatorStyle" />
      </div>
      <!-- Direita: Filtros -->
      <div class="flex items-center gap-2.5 pb-2">
        <!-- Filtros do Mapa Visual (só aparecem nessa view) -->
        <template v-if="viewMode === 'detalhamento'">
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton color="white" class="justify-between" :ui="toolbarButtonUi">
              <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
              <span class="text-sm font-normal text-gray-900 capitalize">{{ painelMesAnoLabel }}</span>
            </UButton>
            <template #panel="{ close }">
              <div class="w-64 p-3">
                <div class="flex items-center justify-between mb-3">
                  <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="painelPickerAno--">
                    <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4 text-operacao-500" />
                  </button>
                  <span class="text-sm font-semibold text-gray-700">{{ painelPickerAno }}</span>
                  <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="painelPickerAno++">
                    <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4 text-operacao-500" />
                  </button>
                </div>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="(nome, idx) in painelMesesNomes" :key="idx"
                    class="px-2 py-1.5 text-sm rounded-md transition-colors capitalize"
                    :class="painelSelectedMes === idx + 1 && painelSelectedAno === painelPickerAno ? 'bg-guardian-600 text-white font-medium' : 'text-operacao-600 hover:bg-operacao-50'"
                    @click="painelSelectMesAno(idx + 1, painelPickerAno); close()"
                  >{{ nome }}</button>
                </div>
              </div>
            </template>
          </UPopover>
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton color="white" class="justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
              <span class="truncate text-left font-normal"><span class="text-operacao-400">Saídas:</span> <span class="text-gray-900">{{ painelTiposSaidaLabel }}</span></span>
            </UButton>
            <template #panel>
              <div class="w-52 py-1.5 px-1">
                <label
                  v-for="opt in painelTiposSaidaOptions"
                  :key="opt.value"
                  class="flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors hover:bg-operacao-50"
                >
                  <input
                    type="checkbox"
                    :value="opt.value"
                    v-model="painelTiposSaida"
                    class="rounded border-operacao-300 text-guardian-600 focus:ring-guardian-500"
                  />
                  <span class="text-operacao-700">{{ opt.label }}</span>
                </label>
              </div>
            </template>
          </UPopover>
        </template>
        <UInput v-if="viewMode === 'posicao'" v-model="posicaoSearch" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-44" :ui="toolbarInputUi" />
        <UInput v-else v-model="painelSearch" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-44" :ui="toolbarInputUi" />
        <button @click="loadAll()" class="flex items-center justify-center w-8 h-8 rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm text-operacao-500 hover:text-guardian-600 hover:ring-guardian-200 hover:bg-guardian-50 transition-all" :disabled="loading">
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4" :class="{ 'animate-spin': loading }" />
        </button>
      </div>
    </div>

    <!-- ======================== CONTEÚDO: POSIÇÃO ATUAL ======================== -->
    <Transition name="view-fade" mode="out-in">
    <div v-if="viewMode === 'posicao'" key="posicao" class="space-y-6">

      <!-- Loading -->
      <div v-if="posicaoLoading" class="space-y-4">
        <div class="grid grid-cols-5 gap-4">
          <USkeleton v-for="i in 5" :key="i" class="h-4" />
        </div>
        <USkeleton v-for="i in 5" :key="i" class="h-12" />
      </div>

      <!-- Tabela -->
      <UCard v-else :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-operacao-100/70 border-b border-operacao-200/60">
              <tr>
                <th class="px-4 py-2 text-left">
                  <button @click="togglePosicaoSort('produto')" class="flex items-center gap-1 font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Produto
                    <span v-if="posicaoSortKey === 'produto'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
                <th class="px-4 py-2 text-right">
                  <button @click="togglePosicaoSort('saldo')" class="flex items-center gap-1 justify-end w-full font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Qtd
                    <span v-if="posicaoSortKey === 'saldo'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
                <th class="px-4 py-2 text-right">
                  <button @click="togglePosicaoSort('custo_medio')" class="flex items-center gap-1 justify-end w-full font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Custo Médio
                    <span v-if="posicaoSortKey === 'custo_medio'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
                <th class="px-4 py-2 text-right">
                  <button @click="togglePosicaoSort('valor_estoque')" class="flex items-center gap-1 justify-end w-full font-medium uppercase tracking-wider text-xs text-[#5a5a66]">
                    Valor Estoque
                    <span v-if="posicaoSortKey === 'valor_estoque'" class="text-operacao-300 !w-3.5 !h-3.5"><UIcon :name="posicaoSortDir === 'asc' ? 'i-heroicons-chevron-up-20-solid' : 'i-heroicons-chevron-down-20-solid'" class="w-3.5 h-3.5" /></span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-operacao-200">
              <tr v-if="posicaoFiltered.length === 0">
                <td colspan="4" class="px-4 py-8 text-center text-operacao-400">
                  <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2 mx-auto" />
                  <p class="text-sm">Nenhum produto encontrado</p>
                </td>
              </tr>
              <tr v-for="item in posicaoPaginatedItems" :key="item.produto_id" class="hover:bg-operacao-50 transition-colors">
                <td class="px-4 py-3">
                  <div>
                    <span class="font-medium text-operacao-800">{{ item.produto }}</span>
                    <span class="text-xs text-operacao-400 ml-1">({{ item.unidade }})</span>
                  </div>
                  <span v-if="item.categoria" class="text-[11px] text-operacao-400">{{ item.categoria }}</span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="font-semibold text-operacao-800">{{ formatNumber(item.saldo) }}</span>
                  <span class="text-xs text-operacao-400 ml-1">{{ item.unidade }}</span>
                </td>
                <td class="px-4 py-3 text-right text-operacao-600">
                  {{ item.custo_medio > 0 ? formatCurrency(item.custo_medio) : '-' }}
                </td>
                <td class="px-4 py-3 text-right font-medium text-operacao-800">
                  {{ item.valor_estoque > 0 ? formatCurrency(item.valor_estoque) : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-model="posicaoPage"
          :page-size="posicaoPageSize"
          :total-items="posicaoFiltered.length"
          @update:page-size="posicaoPageSize = $event"
        >
          <template #extra>
            <span class="text-sm text-operacao-400">|</span>
            <span class="text-sm font-medium text-operacao-600">Valor total: {{ formatCurrency(posicaoData.reduce((sum, p) => sum + p.valor_estoque, 0)) }}</span>
          </template>
        </TablePagination>
      </UCard>
    </div>

    <!-- ======================== CONTEÚDO: MAPA VISUAL PRINCIPAL ======================== -->
    <div v-else-if="viewMode === 'detalhamento'" key="detalhamento" class="space-y-6">
      <!-- Loading skeleton (Mapa Visual) -->
      <div v-if="painelLoading" class="space-y-4">
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-12 gap-4">
              <USkeleton class="h-5 col-span-2" />
              <USkeleton v-for="i in 4" :key="'e'+i" class="h-5" />
              <USkeleton class="h-5" />
              <USkeleton v-for="i in 4" :key="'s'+i" class="h-5" />
              <USkeleton class="h-5" />
            </div>
            <USkeleton v-for="i in 8" :key="i" class="h-10 w-full" />
          </div>
        </div>
      </div>

      <UCard v-if="!painelLoading" :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-operacao-200">
            <thead class="bg-operacao-50">
              <tr>
                <th rowspan="2" class="px-2 py-3 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r cursor-pointer select-none w-[140px] max-w-[140px]" @click="togglePainelSort('produto')">
                  Produto
                  <Icon v-if="painelSortKey === 'produto'" :name="painelSortDir === 'asc' ? 'heroicons:chevron-up-20-solid' : 'heroicons:chevron-down-20-solid'" class="inline w-3.5 h-3.5 text-operacao-400 ml-0.5" />
                </th>
                <th :colspan="painelSemanas.length" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-controle-50">Entradas</th>
                <th rowspan="2" class="px-2 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r bg-controle-50 cursor-pointer select-none" @click="togglePainelSort('total_entradas')">
                  Total
                  <span class="inline-flex flex-col -space-y-1.5 align-middle ml-0.5">
                    <Icon name="heroicons:chevron-up-20-solid" class="w-3 h-3" :class="painelSortKey === 'total_entradas' && painelSortDir === 'asc' ? 'text-operacao-700' : 'text-operacao-300'" />
                    <Icon name="heroicons:chevron-down-20-solid" class="w-3 h-3" :class="painelSortKey === 'total_entradas' && painelSortDir === 'desc' ? 'text-operacao-700' : 'text-operacao-300'" />
                  </span>
                </th>
                <th :colspan="painelSemanas.length" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-red-50">Saídas</th>
                <th rowspan="2" class="px-2 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-red-50 cursor-pointer select-none" @click="togglePainelSort('total_saidas')">
                  Total
                  <span class="inline-flex flex-col -space-y-1.5 align-middle ml-0.5">
                    <Icon name="heroicons:chevron-up-20-solid" class="w-3 h-3" :class="painelSortKey === 'total_saidas' && painelSortDir === 'asc' ? 'text-operacao-700' : 'text-operacao-300'" />
                    <Icon name="heroicons:chevron-down-20-solid" class="w-3 h-3" :class="painelSortKey === 'total_saidas' && painelSortDir === 'desc' ? 'text-operacao-700' : 'text-operacao-300'" />
                  </span>
                </th>
              </tr>
              <tr>
                <th v-for="sem in painelSemanas" :key="'dent-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-controle-50">
                  <MiniCalendar :mes="painelSelectedMes" :ano="painelSelectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                    {{ sem.label }}
                  </MiniCalendar>
                </th>
                <th v-for="sem in painelSemanas" :key="'dsai-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-red-50">
                  <MiniCalendar :mes="painelSelectedMes" :ano="painelSelectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                    {{ sem.label }}
                  </MiniCalendar>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-operacao-200">
              <tr v-if="painelFiltered.length === 0">
                <td :colspan="painelTotalColunas" class="px-3 py-8 text-center text-operacao-400">
                  Nenhum dado encontrado para o período selecionado
                </td>
              </tr>
              <tr v-for="item in painelPaginatedItems" :key="item.produto_id" class="hover:bg-operacao-50">
                <td class="px-2 py-2 text-xs font-medium text-operacao-800 border-r truncate w-[140px] max-w-[140px]" :title="item.produto">{{ item.produto }} <span class="text-[10px] text-operacao-400 font-normal">({{ item.unidade }})</span></td>
                <td v-for="(_, idx) in painelSemanas" :key="'dent-' + idx" class="px-1 py-2 text-xs text-center text-controle-600 bg-controle-50/50">{{ painelFormatQtd(item.entradas_por_semana[idx]) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-controle-700 bg-controle-100 border-r">{{ painelFormatQtd(item.total_entradas) }}</td>
                <td v-for="(_, idx) in painelSemanas" :key="'dsai-' + idx" class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ painelFormatQtd(item.saidas_por_semana[idx]) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-red-700 bg-red-100">{{ painelFormatQtd(item.total_saidas) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          v-model="painelPage"
          :page-size="painelPageSize"
          :total-items="painelFiltered.length"
          @update:page-size="painelPageSize = $event"
        />
      </UCard>
    </div>
    </Transition>

    <!-- ======================== MODAL: NOVA ENTRADA ======================== -->
    <UModal
      v-model="entradaModalOpen"
      :ui="{
        width: 'sm:max-w-3xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-controle-100 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-arrow-down-tray" class="w-5 h-5 text-controle-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-operacao-800">
                  {{ editingEntrada ? 'Editar Entrada' : 'Nova Entrada' }}
                </h3>
                <p class="text-xs text-operacao-400" v-if="!editingEntrada">
                  Adicione um ou mais produtos à entrada
                </p>
              </div>
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="entradaModalOpen = false" />
          </div>
        </template>

        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup label="Data" required>
              <UInput v-model="entradaFormData" type="date" />
            </UFormGroup>
            <UFormGroup label="Número da NF">
              <UInput v-model="entradaFormNf" placeholder="Ex: 001234" />
            </UFormGroup>
          </div>

          <div class="border-t border-operacao-200 dark:border-operacao-700" />

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-operacao-600">Itens da entrada</span>
              <UBadge color="green" variant="subtle" size="xs" v-if="entradaItens.length > 0">
                {{ entradaItens.length }} {{ entradaItens.length === 1 ? 'item' : 'itens' }}
              </UBadge>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in entradaItens"
                :key="index"
                class="relative group rounded-xl border border-operacao-200 dark:border-operacao-700 bg-operacao-50/50 dark:bg-operacao-900/30 p-4 transition-all hover:border-controle-300 hover:shadow-sm"
              >
                <button
                  v-if="entradaItens.length > 1 && !editingEntrada"
                  @click="entradaItens.splice(index, 1)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>

                <div class="mb-3">
                  <USelectMenu
                    v-model="item.produto_id"
                    :options="produtosSelect"
                    placeholder="Buscar produto..."
                    searchable
                    searchable-placeholder="Digite para buscar..."
                    value-attribute="value"
                    option-attribute="label"
                    size="md"
                    :ui="{ trigger: { base: 'w-full' } }"
                  >
                    <template #leading>
                      <UIcon name="i-heroicons-cube" class="w-4 h-4 text-operacao-400" />
                    </template>
                    <template #label>
                      <span v-if="item.produto_id" class="truncate">{{ getProdutoNome(item.produto_id) }}</span>
                      <span v-else class="text-operacao-400">Buscar produto...</span>
                    </template>
                  </USelectMenu>
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Quantidade</label>
                    <div class="flex">
                      <UInput
                        v-model.number="item.quantidade"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        placeholder="0"
                        size="md"
                        :ui="item.produto_id && getProdutoUnidade(item.produto_id) ? { wrapper: 'w-full', base: 'rounded-r-none' } : { wrapper: 'w-full' }"
                      />
                      <div
                        v-if="item.produto_id && getProdutoUnidade(item.produto_id)"
                        class="inline-flex items-center px-3 border border-l-0 border-operacao-300 dark:border-operacao-600 bg-operacao-100 dark:bg-operacao-700 rounded-r-md text-sm font-medium text-operacao-500 dark:text-operacao-300 whitespace-nowrap"
                      >
                        {{ getProdutoUnidade(item.produto_id) }}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Valor Total (R$)</label>
                    <CurrencyInput v-model="item.valor_total" placeholder="0,00" size="md" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Custo Unit.</label>
                    <div class="h-[38px] flex items-center px-3 bg-controle-50 dark:bg-controle-900/20 border border-controle-200 dark:border-controle-800 rounded-md">
                      <span class="text-sm font-semibold text-controle-700 dark:text-controle-400">
                        {{ formatCurrency(calcCustoUnitario(item)) }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="mt-3" v-if="item.showObs">
                  <UTextarea v-model="item.observacao" placeholder="Observações deste item..." :rows="2" size="sm" />
                </div>
                <button
                  v-if="!item.showObs"
                  @click="item.showObs = true"
                  class="mt-2 text-xs text-operacao-400 hover:text-operacao-500 transition-colors flex items-center gap-1"
                >
                  <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-3.5 h-3.5" />
                  Adicionar observação
                </button>
              </div>
            </div>

            <button
              v-if="!editingEntrada"
              @click="entradaItens.push(createEmptyEntradaItem())"
              class="w-full py-3 border-2 border-dashed border-operacao-300 dark:border-operacao-600 rounded-xl text-sm text-operacao-400 hover:border-controle-400 hover:text-controle-600 hover:bg-controle-50/50 transition-all flex items-center justify-center gap-2"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
              Adicionar outro produto
            </button>
          </div>

          <div
            v-if="entradaItens.length > 1"
            class="flex items-center justify-between p-3 bg-controle-50 dark:bg-controle-900/20 rounded-lg border border-controle-200 dark:border-controle-800"
          >
            <span class="text-sm font-medium text-operacao-600 dark:text-operacao-300">Total da entrada</span>
            <span class="text-lg font-bold text-controle-700 dark:text-controle-400">
              {{ formatCurrency(totalEntradaItens) }}
            </span>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="entradaModalOpen = false">Cancelar</UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveEntrada">
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editingEntrada ? 'Salvar Alterações' : `Registrar ${entradaItens.length > 1 ? entradaItens.length + ' Entradas' : 'Entrada'}` }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- ======================== MODAL: NOVA SAÍDA ======================== -->
    <UModal
      v-model="saidaModalOpen"
      :ui="{
        width: 'sm:max-w-3xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg flex items-center justify-center" :class="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' ? 'bg-blue-100' : tipoSaida === 'transferencia' ? 'bg-guardian-100' : 'bg-red-100'">
                <UIcon
                  :name="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' ? 'i-heroicons-building-storefront' : tipoSaida === 'transferencia' ? 'i-heroicons-archive-box' : 'i-heroicons-arrow-up-tray'"
                  class="w-5 h-5"
                  :class="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' ? 'text-blue-600' : tipoSaida === 'transferencia' ? 'text-guardian-600' : 'text-red-600'"
                />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-operacao-800">
                  {{ editingSaida ? 'Editar Saída' : 'Nova Saída' }}
                </h3>
                <p class="text-xs text-operacao-400" v-if="!editingSaida">
                  Adicione um ou mais produtos à saída
                </p>
              </div>
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="saidaModalOpen = false" />
          </div>
        </template>

        <div class="space-y-5">
          <div class="space-y-4">
            <UFormGroup label="Tipo de Saída" required>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  @click="tipoSaida = 'transferencia'; destinoTransferencia = 'apoio'; empresaDestinoId = ''"
                  class="px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  :class="tipoSaida === 'transferencia' && destinoTransferencia === 'apoio'
                    ? 'border-guardian-500 bg-guardian-50 text-guardian-700'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300'"
                >
                  <UIcon name="i-heroicons-archive-box" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate">Apoio</span>
                </button>
                <button
                  type="button"
                  @click="tipoSaida = 'transferencia'; destinoTransferencia = 'loja'"
                  :disabled="outrasEmpresas.length === 0"
                  class="px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  :class="tipoSaida === 'transferencia' && destinoTransferencia === 'loja'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : outrasEmpresas.length === 0
                    ? 'border-operacao-100 bg-operacao-50 text-operacao-300 cursor-not-allowed'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300'"
                >
                  <UIcon name="i-heroicons-building-storefront" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate">Outra Loja</span>
                </button>
                <button
                  type="button"
                  @click="tipoSaida = 'definitiva'; destinoTransferencia = 'apoio'; empresaDestinoId = ''"
                  class="px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  :class="tipoSaida === 'definitiva'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300'"
                >
                  <UIcon name="i-heroicons-arrow-up-tray" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate">Definitiva</span>
                </button>
              </div>
            </UFormGroup>

            <!-- Seletor de loja destino (aparece ao escolher Outra Loja) -->
            <div v-if="tipoSaida === 'transferencia' && destinoTransferencia === 'loja'">
              <USelectMenu
                v-model="empresaDestinoId"
                :options="outrasEmpresas"
                placeholder="Selecionar loja destino..."
                value-attribute="value"
                option-attribute="label"
                searchable
                searchable-placeholder="Buscar loja..."
              >
                <template #leading>
                  <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-blue-500" />
                </template>
                <template #label>
                  <span v-if="empresaDestinoId" class="truncate">{{ outrasEmpresas.find(e => e.value === empresaDestinoId)?.label }}</span>
                  <span v-else class="text-operacao-400">Selecionar loja destino...</span>
                </template>
              </USelectMenu>
            </div>

            <UFormGroup label="Data" required>
              <UInput v-model="saidaFormData" type="date" class="max-w-xs" />
            </UFormGroup>
          </div>

          <div class="border-t border-operacao-200 dark:border-operacao-700" />

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-operacao-600">Itens da saída</span>
              <UBadge :color="tipoSaida === 'transferencia' ? 'blue' : 'red'" variant="subtle" size="xs" v-if="saidaItens.length > 0">
                {{ saidaItens.length }} {{ saidaItens.length === 1 ? 'item' : 'itens' }}
              </UBadge>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in saidaItens"
                :key="index"
                class="relative group rounded-xl border border-operacao-200 dark:border-operacao-700 bg-operacao-50/50 dark:bg-operacao-900/30 p-4 transition-all"
                :class="tipoSaida === 'transferencia' ? 'hover:border-guardian-300 hover:shadow-sm' : 'hover:border-red-300 hover:shadow-sm'"
              >
                <button
                  v-if="saidaItens.length > 1 && !editingSaida"
                  @click="saidaItens.splice(index, 1)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>

                <div class="mb-3">
                  <USelectMenu
                    v-model="item.produto_id"
                    :options="produtosSelectSaida"
                    placeholder="Buscar produto..."
                    searchable
                    searchable-placeholder="Digite para buscar..."
                    value-attribute="value"
                    option-attribute="label"
                    size="md"
                    :ui="{ trigger: { base: 'w-full' } }"
                  >
                    <template #leading>
                      <UIcon name="i-heroicons-cube" class="w-4 h-4 text-operacao-400" />
                    </template>
                    <template #label>
                      <span v-if="item.produto_id" class="truncate">{{ getProdutoNome(item.produto_id) }}</span>
                      <span v-else class="text-operacao-400">Buscar produto...</span>
                    </template>
                  </USelectMenu>
                </div>

                <!-- Produto correspondente na loja destino -->
                <div v-if="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' && empresaDestinoId && item.produto_id" class="mb-3">
                  <label class="block text-xs font-medium text-operacao-400 mb-1">
                    <UIcon name="i-heroicons-building-storefront" class="w-3 h-3 inline text-blue-500" />
                    Produto na loja destino
                  </label>
                  <USelectMenu
                    v-model="item.produto_destino_id"
                    :options="produtosDestino"
                    placeholder="Selecionar produto correspondente..."
                    searchable
                    searchable-placeholder="Buscar produto na loja destino..."
                    value-attribute="value"
                    option-attribute="label"
                    size="md"
                    :loading="loadingProdutosDestino"
                    :ui="{ trigger: { base: 'w-full' } }"
                  >
                    <template #label>
                      <span v-if="item.produto_destino_id" class="truncate text-blue-700">{{ produtosDestino.find(p => p.value === item.produto_destino_id)?.label }}</span>
                      <span v-else class="text-operacao-400">Selecionar produto correspondente...</span>
                    </template>
                  </USelectMenu>
                  <p v-if="item.produto_destino_id" class="text-[10px] text-blue-500 mt-0.5 flex items-center gap-1">
                    <UIcon name="i-heroicons-check-circle" class="w-3 h-3" />
                    Vinculado
                  </p>
                  <p v-else class="text-[10px] text-amber-500 mt-0.5 flex items-center gap-1">
                    <UIcon name="i-heroicons-exclamation-triangle" class="w-3 h-3" />
                    Nenhum produto encontrado — selecione manualmente
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Quantidade</label>
                    <div class="flex">
                      <UInput
                        v-model.number="item.quantidade"
                        type="number"
                        step="0.0001"
                        min="0.0001"
                        placeholder="0"
                        size="md"
                        :ui="item.produto_id && getProdutoUnidade(item.produto_id) ? { wrapper: 'w-full', base: 'rounded-r-none' } : { wrapper: 'w-full' }"
                      />
                      <div
                        v-if="item.produto_id && getProdutoUnidade(item.produto_id)"
                        class="inline-flex items-center px-3 border border-l-0 border-operacao-300 dark:border-operacao-600 bg-operacao-100 dark:bg-operacao-700 rounded-r-md text-sm font-medium text-operacao-500 dark:text-operacao-300 whitespace-nowrap"
                      >
                        {{ getProdutoUnidade(item.produto_id) }}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Estoque Principal</label>
                    <div
                      v-if="item.produto_id"
                      class="h-[38px] flex items-center px-3 rounded-md border"
                      :class="isEstoqueInsuficiente(item)
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                        : 'bg-guardian-50 border-guardian-200 dark:bg-guardian-900/20 dark:border-guardian-800'"
                    >
                      <UIcon
                        :name="isEstoqueInsuficiente(item) ? 'i-heroicons-exclamation-triangle' : 'i-heroicons-check-circle'"
                        class="w-4 h-4 mr-2"
                        :class="isEstoqueInsuficiente(item) ? 'text-red-500' : 'text-guardian-500'"
                      />
                      <span class="text-sm font-medium" :class="isEstoqueInsuficiente(item) ? 'text-red-700' : 'text-guardian-700'">
                        {{ formatNumber(getSaldoItem(item)) }} {{ getProdutoUnidade(item.produto_id) }}
                      </span>
                    </div>
                    <div v-else class="h-[38px] flex items-center px-3 bg-operacao-50 border border-operacao-200 rounded-md">
                      <span class="text-sm text-operacao-400">Selecione um produto</span>
                    </div>
                  </div>
                </div>

                <div v-if="item.produto_id && isEstoqueInsuficiente(item)" class="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-3.5 h-3.5" />
                  Quantidade solicitada excede o estoque disponível
                </div>

                <div class="mt-3" v-if="item.showObs">
                  <UTextarea v-model="item.observacao" placeholder="Observações deste item..." :rows="2" size="sm" />
                </div>
                <button
                  v-if="!item.showObs"
                  @click="item.showObs = true"
                  class="mt-2 text-xs text-operacao-400 hover:text-operacao-500 transition-colors flex items-center gap-1"
                >
                  <UIcon name="i-heroicons-chat-bubble-bottom-center-text" class="w-3.5 h-3.5" />
                  Adicionar observação
                </button>
              </div>
            </div>

            <button
              v-if="!editingSaida"
              @click="saidaItens.push(createEmptySaidaItem())"
              class="w-full py-3 border-2 border-dashed rounded-xl text-sm hover:bg-opacity-50 transition-all flex items-center justify-center gap-2"
              :class="tipoSaida === 'transferencia'
                ? 'border-operacao-300 text-operacao-400 hover:border-guardian-400 hover:text-guardian-600 hover:bg-guardian-50/50'
                : 'border-operacao-300 text-operacao-400 hover:border-red-400 hover:text-red-600 hover:bg-red-50/50'"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
              Adicionar outro produto
            </button>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="saidaModalOpen = false">Cancelar</UButton>
            <UButton
              :color="tipoSaida === 'transferencia' ? 'blue' : 'primary'"
              class="w-full sm:w-auto"
              :loading="saving"
              @click="saveSaida"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editingSaida ? 'Salvar Alterações' : `Registrar ${saidaItens.length > 1 ? saidaItens.length + ' Saídas' : 'Saída'}` }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- ======================== MODAL: CONFIRMAR SAÍDA DEFINITIVA ======================== -->
    <UModal
      v-model="confirmDefinitivaOpen"
      prevent-close
      :ui="{
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="p-2 bg-red-100 rounded-lg flex items-center justify-center">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-red-600" />
            </div>
            <h3 class="text-lg font-semibold text-red-600">Confirmar Saída Definitiva</h3>
          </div>
        </template>

        <div class="space-y-3">
          <p class="text-operacao-600">Você está registrando uma <strong>saída definitiva</strong>. Os produtos abaixo serão removidos permanentemente do estoque:</p>
          <div class="space-y-2">
            <div
              v-for="(item, index) in saidaItensValidosConfirmacao"
              :key="index"
              class="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between"
            >
              <div>
                <p class="font-medium text-operacao-800">{{ getProdutoNome(item.produto_id) }}</p>
                <p class="text-xs text-operacao-400">{{ formatDate(saidaFormData) }}</p>
              </div>
              <span class="font-semibold text-red-700">
                {{ formatNumber(item.quantidade) }} {{ getProdutoUnidade(item.produto_id) }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p class="text-sm text-amber-800 font-medium">Esta ação não pode ser desfeita.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="cancelarConfirmacao">Voltar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="saving" @click="executeSaveSaida">
              <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-1.5" />
              Confirmar Saída Definitiva
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- ======================== MODAL: CONFIRMAR EXCLUSÃO ======================== -->
    <UModal
      v-model="deleteModalOpen"
      :ui="{
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
        </template>

        <p>Tem certeza que deseja excluir esta {{ deletingType === 'entrada' ? 'entrada' : 'saída' }}?</p>
        <div class="mt-2 p-3 bg-operacao-50 rounded-lg">
          <p><strong>Produto:</strong> {{ deletingRow?.produto?.nome }}</p>
          <p v-if="deletingType === 'saida'">
            <strong>Tipo:</strong> {{ deletingRow?.tipo === 'transferencia' ? 'Transferência' : 'Definitiva' }}
          </p>
          <p><strong>Data:</strong> {{ formatDate(deletingRow?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingRow?.quantidade) }}</p>
        </div>
        <p class="text-sm text-operacao-400 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">Cancelar</UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="executeDelete">Excluir</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- ======================== SLIDEOVER: TRANSFERÊNCIAS PENDENTES ======================== -->
    <USlideover
      v-model="showPendentesTransf"
      :ui="{
        width: 'max-w-md',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800'
      }"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200 dark:border-operacao-700">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-100 rounded-lg">
              <UIcon name="i-heroicons-truck" class="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Transferências Pendentes</h3>
              <p class="text-xs text-operacao-400">
                {{ pendentesTransfCount }} {{ pendentesTransfCount === 1 ? 'transferência aguardando' : 'transferências aguardando' }} recebimento
              </p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showPendentesTransf = false" />
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div
            v-for="transf in pendentesTransf"
            :key="transf.id"
            class="p-4 rounded-xl border border-operacao-200 hover:border-blue-300 bg-white hover:bg-blue-50/30 transition-all cursor-pointer group"
            @click="openTransfRecebimento(transf)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-operacao-800 truncate">{{ transf.produto_origem?.nome }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <UBadge color="blue" variant="subtle" size="xs">
                    {{ formatNumber(transf.quantidade) }} {{ transf.produto_origem?.unidade?.sigla }}
                  </UBadge>
                  <span class="text-xs text-operacao-400">{{ formatDate(transf.data) }}</span>
                </div>
                <p class="text-xs text-operacao-400 mt-1.5">
                  De: {{ transf.empresa_origem?.nome }} · {{ formatCurrency(transf.custo_total) }}
                </p>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-operacao-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </div>

          <div v-if="pendentesTransf.length === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
            <UIcon name="i-heroicons-check-circle" class="w-10 h-10 mb-3 text-controle-400" />
            <p class="text-sm font-medium text-operacao-400">Tudo resolvido!</p>
            <p class="text-xs text-operacao-400">Nenhuma transferência pendente</p>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- Modal de Recebimento de Transferência -->
    <MovimentosTransferenciaRecebimentoModal
      v-model="transfRecebimentoModalOpen"
      :transferencia="transfSelecionada"
      @confirmada="onTransfResolvida"
      @rejeitada="onTransfResolvida"
    />

    <!-- Modal: Saída Pós-Entrada -->
    <MovimentosSaidaPosEntradaModal
      v-model="transferenciaApoioOpen"
      :itens-entrada="itensParaApoio"
      @saved="loadAll()"
    />

  </div>
</template>

<script setup lang="ts">
import type { Entrada, Saida, Produto, TipoSaida, PainelMes, SemanaInfo, TransferenciaPendente, PosicaoEstoqueItem } from '~/types'

// ======================== TOOLBAR UI ========================
const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

// ======================== INTERFACES ========================

interface ItemEntrada {
  produto_id: string
  quantidade: number
  valor_total: number
  observacao: string
  showObs: boolean
}

interface ItemSaida {
  produto_id: string
  produto_destino_id: string
  quantidade: number
  observacao: string
  showObs: boolean
}

// ======================== COMPOSABLES ========================

const {
  getEntradas,
  createEntrada,
  updateEntrada,
  deleteEntrada: removeEntrada,
  getSaidas,
  createSaida,
  createSaidaTransferenciaLoja,
  updateSaida,
  deleteSaida: removeSaida,
  getProdutos,
  getSaldoProduto,
  createTransferenciaLoja,
  getTransferenciasPendentes,
  countTransferenciasPendentes,
  confirmarTransferencia,
  rejeitarTransferencia
} = useEstoque()
const { empresaId, empresaAtiva, empresas } = useEmpresa()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

// Painel de Controle composable
const { getPainelMes, getPosicaoEstoque } = useRelatorios()

// ======================== VIEW MODE ========================

const viewMode = ref<'posicao' | 'detalhamento'>('posicao')
const viewModeOptions = [
  { key: 'posicao', icon: 'i-heroicons-squares-2x2', label: 'Posição Atual' },
  { key: 'detalhamento', icon: 'i-heroicons-table-cells', label: 'Mapa Visual' }
]

// Tab sliding indicator
const tabsContainerRef = ref<HTMLElement>()
const tabRefs = reactive<Record<string, HTMLElement>>({})
const tabIndicatorStyle = computed(() => {
  const el = tabRefs[viewMode.value]
  if (!el || !tabsContainerRef.value) return { left: '0px', width: '0px' }
  const containerRect = tabsContainerRef.value.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  return {
    left: `${elRect.left - containerRect.left}px`,
    width: `${elRect.width}px`
  }
})

// ======================== STATE: PAGE ========================

const produtos = ref<Produto[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)

// ======================== STATE: MODALS ========================

const entradaModalOpen = ref(false)
const saidaModalOpen = ref(false)
const deleteModalOpen = ref(false)
const confirmDefinitivaOpen = ref(false)

// Transferência para Apoio
const transferenciaApoioOpen = ref(false)
const itensParaApoio = ref<Array<{ produto_id: string; quantidade: number; produto_nome: string; unidade_sigla: string }>>([])

watch(transferenciaApoioOpen, (aberto) => {
  if (!aberto) {
    itensParaApoio.value = []
    loadAll()
  }
})

// ======================== STATE: POSIÇÃO ATUAL ========================

const posicaoData = ref<PosicaoEstoqueItem[]>([])
const posicaoLoading = ref(false)
const posicaoSearch = ref('')
const posicaoSortKey = ref<'produto' | 'saldo' | 'custo_medio' | 'valor_estoque'>('produto')
const posicaoSortDir = ref<'asc' | 'desc'>('desc')
const posicaoPage = ref(1)
const posicaoPageSize = ref(10)

// Segurança % (reusar mesma chave do AnalisesPanel)
const POSICAO_SEG_KEY = computed(() => `seguranca_map_${empresaId.value || 'default'}`)
const posicaoSegMap = ref<Record<string, number>>({})
const loadPosicaoSeg = () => {
  try {
    const stored = localStorage.getItem(POSICAO_SEG_KEY.value)
    posicaoSegMap.value = stored ? JSON.parse(stored) : {}
  } catch { posicaoSegMap.value = {} }
}
const getPosicaoSeg = (produtoId: string) => posicaoSegMap.value[produtoId] ?? 20

const getPosicaoStatus = (item: PosicaoEstoqueItem): 'adequado' | 'atencao' | 'critico' => {
  const segPct = getPosicaoSeg(item.produto_id) / 100
  const pontoReposicao = item.media_semanal * (1 + segPct)
  if (item.saldo <= 0) return 'critico'
  if (item.saldo < pontoReposicao) return 'atencao'
  return 'adequado'
}

const posicaoFiltered = computed(() => {
  let result = posicaoData.value
  if (posicaoSearch.value) {
    const term = posicaoSearch.value.toLowerCase()
    result = result.filter(p => p.produto.toLowerCase().includes(term) || p.categoria.toLowerCase().includes(term))
  }
  return result
})

const posicaoSorted = computed(() => {
  const arr = [...posicaoFiltered.value]
  arr.sort((a, b) => {
    let cmp = 0
    if (posicaoSortKey.value === 'produto') {
      cmp = a.produto.localeCompare(b.produto)
    } else if (posicaoSortKey.value === 'saldo') {
      cmp = a.saldo - b.saldo
    } else if (posicaoSortKey.value === 'custo_medio') {
      cmp = a.custo_medio - b.custo_medio
    } else if (posicaoSortKey.value === 'valor_estoque') {
      cmp = a.valor_estoque - b.valor_estoque
    }
    return posicaoSortDir.value === 'asc' ? cmp : -cmp
  })
  return arr
})

const posicaoPaginatedItems = computed(() => {
  const start = (posicaoPage.value - 1) * posicaoPageSize.value
  return posicaoSorted.value.slice(start, start + posicaoPageSize.value)
})

const togglePosicaoSort = (key: typeof posicaoSortKey.value) => {
  if (posicaoSortKey.value === key) {
    posicaoSortDir.value = posicaoSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    posicaoSortKey.value = key
    posicaoSortDir.value = key === 'produto' ? 'asc' : 'desc'
  }
  posicaoPage.value = 1
}

// KPIs Posição Atual
const posicaoKpis = computed(() => {
  const data = posicaoData.value
  const comSaldo = data.filter(p => p.saldo > 0).length
  const emAlerta = data.filter(p => {
    const st = getPosicaoStatus(p)
    return st === 'critico' || st === 'atencao'
  }).length
  const valorTotal = data.reduce((sum, p) => sum + p.valor_estoque, 0)
  return { comSaldo, emAlerta, valorTotal }
})

const loadPosicao = async () => {
  posicaoLoading.value = true
  try {
    loadPosicaoSeg()
    posicaoData.value = await getPosicaoEstoque()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar posição de estoque', color: 'red' })
  } finally {
    posicaoLoading.value = false
  }
}

// ======================== STATE: PAINEL DE CONTROLE (MAPA VISUAL PRINCIPAL) ========================

const painelData = ref<PainelMes[]>([])
const painelSemanas = ref<SemanaInfo[]>([])
const painelLoading = ref(false)
const painelSearch = ref('')
const painelHoje = new Date()
const painelSelectedMes = ref(painelHoje.getMonth() + 1)
const painelSelectedAno = ref(painelHoje.getFullYear())
const painelPickerAno = ref(painelHoje.getFullYear())
const painelMesesNomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const painelMesAnoLabel = computed(() => `${painelMesesNomes[painelSelectedMes.value - 1]} ${painelSelectedAno.value}`)
const painelSelectMesAno = (mes: number, ano: number) => {
  painelSelectedMes.value = mes
  painelSelectedAno.value = ano
}
const painelPage = ref(1)
const painelPageSize = ref(10)
const painelSortKey = ref<'produto' | 'total_entradas' | 'total_saidas'>('total_saidas')
const painelSortDir = ref<'asc' | 'desc'>('desc')
const togglePainelSort = (key: typeof painelSortKey.value) => {
  if (painelSortKey.value === key) {
    painelSortDir.value = painelSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    painelSortKey.value = key
    painelSortDir.value = key === 'produto' ? 'asc' : 'desc'
  }
  painelPage.value = 1
}

// ======================== STATE: FILTROS MAPA VISUAL ========================
const painelTiposSaida = ref<string[]>(['definitiva', 'transf_loja', 'transf_apoio', 'producao'])
const painelTiposSaidaOptions = [
  { value: 'definitiva', label: 'Definitiva' },
  { value: 'transf_loja', label: 'Transf. Loja' },
  { value: 'transf_apoio', label: 'Transf. Apoio' },
  { value: 'producao', label: 'Produção' }
]

// ======================== STATE: ENTRADA MODAL ========================

const editingEntrada = ref<Entrada | null>(null)
const entradaFormData = ref(new Date().toISOString().split('T')[0])
const entradaFormNf = ref('')
const entradaItens = ref<ItemEntrada[]>([])

// ======================== STATE: SAÍDA MODAL ========================

const editingSaida = ref<Saida | null>(null)
const saidaFormData = ref(new Date().toISOString().split('T')[0])
const tipoSaida = ref<TipoSaida>('definitiva')
const destinoTransferencia = ref<'apoio' | 'loja'>('apoio')
const empresaDestinoId = ref('')
const produtosDestino = ref<{ value: string; label: string; nome: string }[]>([])
const loadingProdutosDestino = ref(false)
const saidaItens = ref<ItemSaida[]>([])
const saldosCache = ref<Map<string, number>>(new Map())

// ======================== STATE: DELETE ========================

const deletingType = ref<'entrada' | 'saida'>('entrada')
const deletingRow = ref<any>(null)

// ======================== STATE: TRANSFERÊNCIAS PENDENTES ========================

const showPendentesTransf = ref(false)
const pendentesTransf = ref<TransferenciaPendente[]>([])
const pendentesTransfCount = ref(0)
const transfRecebimentoModalOpen = ref(false)
const transfSelecionada = ref<TransferenciaPendente | null>(null)

// ======================== COMPUTED: PAINEL ========================

// Colunas da tabela: Produto + (semanas+tot)*2 entradas/saídas
const painelTotalColunas = computed(() => 1 + (painelSemanas.value.length + 1) * 2)

const painelFiltered = computed(() => {
  const term = painelSearch.value.toLowerCase()
  let data = painelData.value
  if (term) {
    data = data.filter(p =>
      p.produto.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term)
    )
  }

  const tipos = painelTiposSaida.value
  const allSelected = tipos.length === 4
  if (allSelected) return data

  // Recalcular saídas por semana baseado nos tipos selecionados
  return data.map(p => {
    const saidas_por_semana = p.saidas_por_semana.map((_, idx) => {
      let total = 0
      if (tipos.includes('definitiva')) total += (p.saidas_definitiva_por_semana?.[idx] || 0)
      if (tipos.includes('transf_loja')) total += (p.saidas_transf_loja_por_semana?.[idx] || 0)
      if (tipos.includes('transf_apoio')) total += (p.saidas_transf_apoio_por_semana?.[idx] || 0)
      if (tipos.includes('producao')) total += (p.saidas_producao_por_semana?.[idx] || 0)
      return total
    })
    const total_saidas = saidas_por_semana.reduce((sum, v) => sum + v, 0)

    return {
      ...p,
      saidas_por_semana,
      total_saidas
    }
  })
})

const painelTiposSaidaLabel = computed(() => {
  const sel = painelTiposSaida.value
  if (sel.length === 4) return 'Todas'
  if (sel.length === 0) return 'Nenhuma'
  if (sel.length <= 2) return sel.map(v => painelTiposSaidaOptions.find(o => o.value === v)?.label).join(', ')
  return `${sel.length} tipos`
})

const painelSorted = computed(() => {
  const data = [...painelFiltered.value]
  const key = painelSortKey.value
  const dir = painelSortDir.value === 'asc' ? 1 : -1
  return data.sort((a, b) => {
    if (key === 'produto') return dir * a.produto.localeCompare(b.produto, 'pt-BR')
    return dir * ((a[key] || 0) - (b[key] || 0))
  })
})

const painelPaginatedItems = computed(() => {
  const start = (painelPage.value - 1) * painelPageSize.value
  const end = start + painelPageSize.value
  return painelSorted.value.slice(start, end)
})

const painelResumo = computed(() => {
  const data = painelFiltered.value
  return {
    totalEntradas: data.reduce((sum, p) => sum + (p.total_entradas * p.custo), 0),
    totalSaidas: data.reduce((sum, p) => sum + (p.total_saidas * p.custo), 0),
    estoqueFinal: data.reduce((sum, p) => sum + p.valor_total, 0)
  }
})

const painelTruncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const painelFormatQtd = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return '-'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(painelTruncate2(value))
}

// ======================== COMPUTED: PRODUTO SELECTS ========================

const produtosSelect = computed(() =>
  produtos.value.map(p => ({
    label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
    value: p.id
  }))
)

const produtosSelectSaida = computed(() => produtosSelect.value)

const outrasEmpresas = computed(() =>
  empresas.value
    .filter(e => e.id !== empresaId.value && e.ativo)
    .map(e => ({ label: e.nome, value: e.id }))
)

const saidaItensValidosConfirmacao = computed(() =>
  saidaItens.value.filter(item => item.produto_id)
)

const totalEntradaItens = computed(() =>
  entradaItens.value.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0)
)

// ======================== HELPERS ========================

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const getProdutoNome = (produtoId: string) => {
  const p = produtos.value.find(p => p.id === produtoId)
  return p ? p.nome : ''
}

const getProdutoUnidade = (produtoId: string) => {
  const p = produtos.value.find(p => p.id === produtoId)
  return p?.unidade?.sigla || ''
}

const calcCustoUnitario = (item: ItemEntrada) => {
  if (!item.quantidade || item.quantidade === 0) return 0
  return (item.valor_total || 0) / item.quantidade
}

const createEmptyEntradaItem = (): ItemEntrada => ({
  produto_id: '',
  quantidade: 0,
  valor_total: 0,
  observacao: '',
  showObs: false
})

const createEmptySaidaItem = (): ItemSaida => ({
  produto_id: '',
  produto_destino_id: '',
  quantidade: 0,
  observacao: '',
  showObs: false
})

const getSaldoItem = (item: ItemSaida): number => {
  if (!item.produto_id) return 0
  return saldosCache.value.get(item.produto_id) ?? 0
}

const isEstoqueInsuficiente = (item: ItemSaida): boolean => {
  if (!item.produto_id || !item.quantidade) return false
  const saldo = getSaldoItem(item)
  const qtdOriginal = editingSaida.value?.produto_id === item.produto_id ? editingSaida.value.quantidade : 0
  return item.quantidade > saldo + qtdOriginal
}

const carregarSaldoProduto = async (produtoId: string) => {
  if (!produtoId || saldosCache.value.has(produtoId)) return
  try {
    const saldo = await getSaldoProduto(produtoId)
    saldosCache.value.set(produtoId, saldo)
  } catch (error) {
    saldosCache.value.set(produtoId, 0)
  }
}

// ======================== LOAD FUNCTIONS ========================

const loadProdutos = async () => {
  try {
    produtos.value = await getProdutos()
  } catch (error) {
  }
}

const loadPendentesTransf = async () => {
  try {
    pendentesTransfCount.value = await countTransferenciasPendentes()
    pendentesTransf.value = pendentesTransfCount.value > 0 ? await getTransferenciasPendentes() : []
  } catch (error) {
  }
}

const loadPainel = async () => {
  try {
    painelLoading.value = true
    const resultado = await getPainelMes(painelSelectedAno.value, painelSelectedMes.value)
    painelSemanas.value = resultado.semanas
    painelData.value = resultado.itens
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar painel',
      color: 'red'
    })
  } finally {
    painelLoading.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  const tasks = [loadProdutos(), loadPendentesTransf()]
  if (viewMode.value === 'posicao') tasks.push(loadPosicao())
  if (viewMode.value === 'detalhamento') tasks.push(loadPainel())
  await Promise.all(tasks)
  loading.value = false
}

// ======================== MODAL: ENTRADA ========================

const openEntradaModal = (entrada?: Entrada) => {
  if (entrada) {
    editingEntrada.value = entrada
    entradaFormData.value = entrada.data
    entradaFormNf.value = entrada.numero_nf || ''
    entradaItens.value = [{
      produto_id: entrada.produto_id,
      quantidade: entrada.quantidade,
      valor_total: entrada.valor_total,
      observacao: entrada.observacao || '',
      showObs: !!entrada.observacao
    }]
  } else {
    editingEntrada.value = null
    entradaFormData.value = new Date().toISOString().split('T')[0]
    entradaFormNf.value = ''
    entradaItens.value = [createEmptyEntradaItem()]
  }
  entradaModalOpen.value = true
}

const saveEntrada = async () => {
  const itensValidos = entradaItens.value.filter(item => item.produto_id)
  if (itensValidos.length === 0) {
    toast.add({ title: 'Atenção', description: 'Selecione pelo menos um produto', color: 'amber' })
    return
  }
  for (const item of itensValidos) {
    if (!item.quantidade || item.quantidade <= 0) {
      toast.add({ title: 'Atenção', description: `Informe a quantidade para "${getProdutoNome(item.produto_id)}"`, color: 'amber' })
      return
    }
    if (!item.valor_total || item.valor_total <= 0) {
      toast.add({ title: 'Atenção', description: `Informe o valor total para "${getProdutoNome(item.produto_id)}"`, color: 'amber' })
      return
    }
  }
  if (!entradaFormData.value) {
    toast.add({ title: 'Atenção', description: 'Informe a data da entrada', color: 'amber' })
    return
  }

  try {
    saving.value = true
    if (editingEntrada.value) {
      const item = itensValidos[0]
      await updateEntrada(editingEntrada.value.id, {
        produto_id: item.produto_id,
        data: entradaFormData.value,
        quantidade: item.quantidade,
        custo_unitario: calcCustoUnitario(item),
        valor_total: item.valor_total,
        numero_nf: entradaFormNf.value || undefined,
        observacao: item.observacao || undefined
      })
      toast.add({ title: 'Sucesso', description: 'Entrada atualizada com sucesso', color: 'green' })
    } else {
      for (const item of itensValidos) {
        await createEntrada({
          produto_id: item.produto_id,
          data: entradaFormData.value,
          quantidade: item.quantidade,
          custo_unitario: calcCustoUnitario(item),
          valor_total: item.valor_total,
          numero_nf: entradaFormNf.value || undefined,
          observacao: item.observacao || undefined
        })
      }
      toast.add({
        title: 'Sucesso',
        description: itensValidos.length > 1
          ? `${itensValidos.length} entradas registradas com sucesso`
          : 'Entrada registrada com sucesso',
        color: 'green'
      })

      // Preparar sugestão de transferência para apoio (se habilitado)
      if (empresaAtiva.value?.sugerir_transferencia_apoio !== false) {
        itensParaApoio.value = itensValidos.map(item => {
          const prod = produtos.value.find(p => p.id === item.produto_id)
          return {
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            produto_nome: prod?.nome || 'Produto',
            unidade_sigla: prod?.unidade?.sigla || ''
          }
        })
      }
    }
    entradaModalOpen.value = false
    await loadAll()

    // Abrir modal de apoio após modal de entrada fechar
    if (itensParaApoio.value.length > 0) {
      setTimeout(() => {
        transferenciaApoioOpen.value = true
      }, 350)
    }
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar entrada', color: 'red' })
  } finally {
    saving.value = false
  }
}

// ======================== MODAL: SAÍDA ========================

const openSaidaModal = async (saida?: Saida) => {
  saldosCache.value = new Map()
  if (saida) {
    editingSaida.value = saida
    tipoSaida.value = saida.tipo || 'definitiva'
    saidaFormData.value = saida.data
    saidaItens.value = [{
      produto_id: saida.produto_id,
      produto_destino_id: '',
      quantidade: saida.quantidade,
      observacao: saida.observacao || '',
      showObs: !!saida.observacao
    }]
    await carregarSaldoProduto(saida.produto_id)
  } else {
    editingSaida.value = null
    tipoSaida.value = 'transferencia'
    destinoTransferencia.value = 'apoio'
    empresaDestinoId.value = ''
    saidaFormData.value = new Date().toISOString().split('T')[0]
    saidaItens.value = [createEmptySaidaItem()]
  }
  saidaModalOpen.value = true
}

const validarSaidaItens = (): boolean => {
  const itensValidos = saidaItensValidosConfirmacao.value
  if (itensValidos.length === 0) {
    toast.add({ title: 'Atenção', description: 'Selecione pelo menos um produto', color: 'amber' })
    return false
  }
  for (const item of itensValidos) {
    if (!item.quantidade || item.quantidade <= 0) {
      toast.add({ title: 'Atenção', description: `Informe a quantidade para "${getProdutoNome(item.produto_id)}"`, color: 'amber' })
      return false
    }
    if (isEstoqueInsuficiente(item)) {
      const saldo = getSaldoItem(item)
      toast.add({
        title: 'Estoque Insuficiente',
        description: `"${getProdutoNome(item.produto_id)}" - Estoque disponível: ${formatNumber(saldo)}. Solicitado: ${formatNumber(item.quantidade)}.`,
        color: 'red'
      })
      return false
    }
  }
  if (!saidaFormData.value) {
    toast.add({ title: 'Atenção', description: 'Informe a data da saída', color: 'amber' })
    return false
  }
  if (tipoSaida.value === 'transferencia' && destinoTransferencia.value === 'loja' && !empresaDestinoId.value) {
    toast.add({ title: 'Atenção', description: 'Selecione a loja destino da transferência', color: 'amber' })
    return false
  }
  if (tipoSaida.value === 'transferencia' && destinoTransferencia.value === 'loja') {
    const semDestino = saidaItensValidosConfirmacao.value.find(i => !i.produto_destino_id)
    if (semDestino) {
      toast.add({ title: 'Atenção', description: 'Vincule o produto correspondente na loja destino para todos os itens', color: 'amber' })
      return false
    }
  }
  return true
}

const saveSaida = async () => {
  if (!validarSaidaItens()) return
  if (tipoSaida.value === 'definitiva') {
    saidaModalOpen.value = false
    confirmDefinitivaOpen.value = true
    return
  }
  await executeSaveSaida()
}

const cancelarConfirmacao = () => {
  confirmDefinitivaOpen.value = false
  saidaModalOpen.value = true
}

const executeSaveSaida = async () => {
  const itensValidos = saidaItensValidosConfirmacao.value
  try {
    saving.value = true
    if (editingSaida.value) {
      const item = itensValidos[0]
      await updateSaida(editingSaida.value.id, {
        produto_id: item.produto_id,
        tipo: tipoSaida.value,
        data: saidaFormData.value,
        quantidade: item.quantidade,
        observacao: item.observacao || undefined
      })
      toast.add({ title: 'Sucesso', description: 'Saída atualizada com sucesso', color: 'green' })
    } else {
      const isTransferenciaLoja = tipoSaida.value === 'transferencia' && destinoTransferencia.value === 'loja' && empresaDestinoId.value
      for (const item of itensValidos) {
        if (isTransferenciaLoja) {
          await createTransferenciaLoja(
            item.produto_id,
            item.produto_destino_id,
            empresaDestinoId.value,
            item.quantidade,
            saidaFormData.value,
            item.observacao || undefined
          )
        } else {
          await createSaida({
            produto_id: item.produto_id,
            tipo: tipoSaida.value,
            data: saidaFormData.value,
            quantidade: item.quantidade,
            observacao: item.observacao || undefined
          })
        }
      }
      const nomeDestino = outrasEmpresas.value.find(e => e.value === empresaDestinoId.value)?.label
      toast.add({
        title: 'Sucesso',
        description: isTransferenciaLoja
          ? `Transferência enviada para ${nomeDestino}. Aguardando confirmação de recebimento.`
          : itensValidos.length > 1
          ? `${itensValidos.length} saídas registradas com sucesso`
          : 'Saída registrada com sucesso',
        color: 'green'
      })
    }
    confirmDefinitivaOpen.value = false
    saidaModalOpen.value = false
    await loadAll()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar saída', color: 'red' })
  } finally {
    saving.value = false
  }
}

// ======================== DELETE ========================

const confirmDeleteRow = (row: any) => {
  deletingType.value = row._tipoMov
  deletingRow.value = row._tipoMov === 'entrada' ? row._entradaOriginal : row._saidaOriginal
  deleteModalOpen.value = true
}

const executeDelete = async () => {
  if (!deletingRow.value) return
  try {
    deleting.value = true
    if (deletingType.value === 'entrada') {
      await removeEntrada(deletingRow.value.id)
      toast.add({ title: 'Sucesso', description: 'Entrada excluída com sucesso', color: 'green' })
    } else {
      await removeSaida(deletingRow.value.id)
      toast.add({ title: 'Sucesso', description: 'Saída excluída com sucesso', color: 'green' })
    }
    deleteModalOpen.value = false
    await loadAll()
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir', color: 'red' })
  } finally {
    deleting.value = false
  }
}

// ======================== TRANSFERÊNCIAS PENDENTES ========================

const openTransfRecebimento = (transf: TransferenciaPendente) => {
  showPendentesTransf.value = false
  transfSelecionada.value = transf
  setTimeout(() => { transfRecebimentoModalOpen.value = true }, 300)
}

const onTransfResolvida = async () => {
  await loadAll()
}

// ======================== WATCHERS ========================

watch([painelSelectedMes, painelSelectedAno], () => {
  if (viewMode.value === 'detalhamento') loadPainel()
})

watch(viewMode, (val) => {
  if (val === 'posicao') {
    if (posicaoData.value.length === 0) loadPosicao()
  } else if (val === 'detalhamento') {
    if (painelData.value.length === 0) loadPainel()
  }
})

watch(
  () => saidaItens.value.map(i => i.produto_id),
  (novosProdutos, antigos) => {
    novosProdutos.forEach((produtoId, idx) => {
      if (produtoId) carregarSaldoProduto(produtoId)
      // Auto-match: quando produto origem muda, buscar correspondente no destino
      if (produtoId && produtoId !== antigos?.[idx] && destinoTransferencia.value === 'loja' && produtosDestino.value.length > 0) {
        const nomeOrigem = getProdutoNome(produtoId).toLowerCase()
        const match = produtosDestino.value.find(p => p.nome.toLowerCase() === nomeOrigem)
          || produtosDestino.value.find(p => p.nome.toLowerCase().includes(nomeOrigem) || nomeOrigem.includes(p.nome.toLowerCase()))
        saidaItens.value[idx].produto_destino_id = match?.value || ''
      }
    })
  },
  { deep: true }
)

// Carregar produtos da loja destino quando empresa destino mudar
watch(empresaDestinoId, async (novoId) => {
  if (!novoId) {
    produtosDestino.value = []
    return
  }
  try {
    loadingProdutosDestino.value = true
    const { data, error } = await useSupabaseClient()
      .from('produtos')
      .select('id, nome')
      .eq('empresa_id', novoId)
      .eq('ativo', true)
      .order('nome')
    if (error) throw error
    produtosDestino.value = (data || []).map(p => ({ value: p.id, label: p.nome, nome: p.nome }))
    // Auto-match itens já preenchidos
    saidaItens.value.forEach(item => {
      if (item.produto_id && !item.produto_destino_id) {
        const nomeOrigem = getProdutoNome(item.produto_id).toLowerCase()
        const match = produtosDestino.value.find(p => p.nome.toLowerCase() === nomeOrigem)
          || produtosDestino.value.find(p => p.nome.toLowerCase().includes(nomeOrigem) || nomeOrigem.includes(p.nome.toLowerCase()))
        item.produto_destino_id = match?.value || ''
      }
    })
  } catch (e) {
  } finally {
    loadingProdutosDestino.value = false
  }
})

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['produtos', 'entradas', 'saidas', 'ajustes'], () => loadAll())

watch(empresaId, () => {
  if (empresaId.value) {
    loadAll()
    if (viewMode.value === 'posicao') loadPosicao()
  }
}, { immediate: true })
</script>

<style scoped>
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.view-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
