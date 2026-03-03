<template>
  <div class="space-y-6">

    <!-- Header + Ações -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-[#5a5a66]">Controle de Estoque</h1>
      <div class="flex gap-2 flex-shrink-0">
        <UButton v-if="pendentesCount > 0" color="white" class="hover:!bg-purple-50 hover:!ring-purple-200" :ui="toolbarButtonUi" @click="showPendentes = true">
          <UIcon name="i-heroicons-beaker" class="w-4 h-4 mr-1.5 text-purple-500" />
          Produções
          <span class="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none rounded-full bg-purple-500 text-white">{{ pendentesCount }}</span>
        </UButton>
        <UButton color="white" class="hover:!bg-emerald-50 hover:!ring-emerald-200" :ui="toolbarButtonUi" @click="openEntradaModal()">
          <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4 mr-1.5 text-emerald-500" />
          Entrada
        </UButton>
        <UButton color="white" class="hover:!bg-red-50 hover:!ring-red-200" :ui="toolbarButtonUi" @click="openSaidaModal()">
          <UIcon name="i-heroicons-arrow-up-tray" class="w-4 h-4 mr-1.5 text-red-500" />
          Saída
        </UButton>
      </div>
    </div>

    <!-- ======================== KPIs ======================== -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-guardian-400" />
          <span class="text-[11px] font-medium text-operacao-400">Movimentações</span>
        </div>
        <p class="text-base font-bold text-operacao-800">{{ filteredMovimentos.length }}</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-controle-400" />
          <span class="text-[11px] font-medium text-operacao-400">Entradas</span>
        </div>
        <p class="text-base font-bold text-controle-700">{{ formatCurrency(totalEntradas) }}</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span class="text-[11px] font-medium text-operacao-400">Saídas</span>
        </div>
        <p class="text-base font-bold text-red-600">{{ formatCurrency(totalSaidas) }}</p>
      </div>
      <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="w-1.5 h-1.5 rounded-full" :class="saldoPeriodo >= 0 ? 'bg-controle-400' : 'bg-red-400'" />
          <span class="text-[11px] font-medium text-operacao-400">Saldo</span>
        </div>
        <p class="text-base font-bold" :class="saldoPeriodo >= 0 ? 'text-controle-700' : 'text-red-600'">
          {{ formatCurrency(saldoPeriodo) }}
        </p>
      </div>
    </div>

    <!-- KPIs do detalhamento agora estão dentro do waterfall flow -->

    <!-- ======================== CONTEÚDO: HISTÓRICO ======================== -->
    <template v-if="viewMode === 'historico'">
      <!-- Filtros Histórico + View Switcher -->
      <div class="flex items-center gap-3">
        <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />
        <!-- Date Range Picker -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" :ui="toolbarButtonUi">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
            <span class="text-sm font-normal" :class="dateRange.start ? 'text-gray-900' : 'text-operacao-400'">
              {{ dateRangeLabel }}
            </span>
          </UButton>
          <template #panel="{ close }">
            <div class="p-2">
              <ClientOnly>
                <VDatePicker
                  v-model.range="dateRange"
                  :columns="1"
                  locale="pt-BR"
                  :first-day-of-week="1"
                  color="blue"
                  @dayclick="onDayClick(close)"
                />
              </ClientOnly>
            </div>
          </template>
        </UPopover>
        <!-- Filtro Tipo -->
        <UPopover :popper="{ placement: 'bottom-start' }">
          <UButton color="white" class="w-full sm:w-auto justify-between" trailing-icon="i-heroicons-chevron-down-20-solid" :ui="toolbarButtonUi">
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Tipo:</span> <span class="text-gray-900">{{ tipoFilterLabel }}</span></span>
          </UButton>
          <template #panel="{ close }">
            <div class="w-48 py-1">
              <button
                v-for="opt in tipoFilterOptions"
                :key="opt.value"
                class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                :class="filtroTipo === opt.value ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                @click="filtroTipo = opt.value; close()"
              >
                {{ opt.label }}
              </button>
            </div>
          </template>
        </UPopover>
        <UButton
          v-if="hasActiveFilters"
          color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" size="xs"
          class="rounded-full" :ui="{ rounded: 'rounded-full' }" @click="clearFilters"
        />
        </div>
        <!-- View Switcher -->
        <!-- View Switcher -->
        <div class="inline-flex items-center rounded-lg bg-operacao-100/80 p-0.5 ring-1 ring-operacao-200/60 flex-shrink-0">
          <button v-for="v in viewModeOptions" :key="v.key" @click="viewMode = v.key as any"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="viewMode === v.key ? 'bg-white text-operacao-800 shadow-sm ring-1 ring-operacao-200/60' : 'text-operacao-400 hover:text-operacao-600'">
            <UIcon :name="v.icon" class="w-3.5 h-3.5" /><span>{{ v.label }}</span>
          </button>
        </div>
      </div>
      <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66]', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }"
      >
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #data-data="{ row }">
          {{ formatDate(row.data) }}
        </template>

        <template #tipoDisplay-data="{ row }">
          <UBadge :color="getTipoBadgeColor(row)" variant="soft" size="sm">
            {{ getTipoLabel(row) }}
          </UBadge>
        </template>

        <template #produto-data="{ row }">
          <div>
            <p class="font-semibold text-operacao-800 dark:text-white">{{ row.produto?.nome || '-' }}</p>
            <p class="text-xs text-operacao-400">{{ row.produto?.categoria?.nome || '' }}</p>
          </div>
        </template>

        <template #quantidade-data="{ row }">
          {{ formatNumber(row.quantidade) }} {{ row.produto?.unidade?.sigla || '' }}
        </template>

        <template #valor-data="{ row }">
          <span class="font-medium" :class="row._tipoMov === 'entrada' ? 'text-controle-600' : 'text-red-600'">
            {{ formatCurrency(row.valor) }}
          </span>
        </template>

        <template #numero_nf-data="{ row }">
          {{ row.numero_nf || '-' }}
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="editRow(row)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click="confirmDeleteRow(row)"
            />
          </div>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredMovimentos.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>
    </template>

    <!-- ======================== CONTEÚDO: DETALHAMENTO ======================== -->
    <template v-if="viewMode === 'detalhamento'">
      <!-- Filtros Detalhamento + View Switcher -->
      <div class="flex items-center gap-3">
        <div class="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />
          <UPopover :popper="{ placement: 'bottom-start' }">
            <UButton color="white" class="w-full sm:w-auto justify-between" :ui="toolbarButtonUi">
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
        </div>
        <!-- View Switcher -->
        <div class="inline-flex items-center rounded-lg bg-operacao-100/80 p-0.5 ring-1 ring-operacao-200/60 flex-shrink-0">
          <button v-for="v in viewModeOptions" :key="v.key" @click="viewMode = v.key as any"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all"
            :class="viewMode === v.key ? 'bg-white text-operacao-800 shadow-sm ring-1 ring-operacao-200/60' : 'text-operacao-400 hover:text-operacao-600'">
            <UIcon :name="v.icon" class="w-3.5 h-3.5" /><span>{{ v.label }}</span>
          </button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="painelLoading" class="space-y-4">
        <div class="grid grid-cols-4 gap-4">
          <USkeleton v-for="i in 4" :key="i" class="h-24 rounded-lg" />
        </div>
        <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
          <div class="p-4 space-y-3">
            <USkeleton class="h-8 w-full" />
            <USkeleton v-for="i in 6" :key="i" class="h-10 w-full" />
          </div>
        </div>
      </div>

      <template v-if="!painelLoading">
        <!-- ============ TABELA POR PRODUTO ============ -->
        <div class="relative overflow-x-auto rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm">
          <table class="min-w-full divide-y divide-operacao-200">
            <thead class="bg-operacao-50">
              <tr>
                <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r">Produto</th>
                <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r w-14">E.I.</th>
                <th :colspan="painelSemanas.length + 1" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r bg-controle-50">Entradas</th>
                <th :colspan="painelSemanas.length + 1" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r bg-red-50">Saídas</th>
                <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r w-14">E.F.</th>
                <th colspan="4" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-operacao-100/50 border-r">Breakdown Saídas</th>
                <th colspan="2" class="px-3 py-2 text-center text-xs font-medium text-violet-600 uppercase tracking-wider bg-violet-50/60">Est. Apoio</th>
              </tr>
              <tr>
                <th v-for="sem in painelSemanas" :key="'dent-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-controle-50">
                  <MiniCalendar :mes="painelSelectedMes" :ano="painelSelectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                    {{ sem.label }}
                  </MiniCalendar>
                </th>
                <th class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-controle-50 border-r">Tot</th>
                <th v-for="sem in painelSemanas" :key="'dsai-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-red-50">
                  <MiniCalendar :mes="painelSelectedMes" :ano="painelSelectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                    {{ sem.label }}
                  </MiniCalendar>
                </th>
                <th class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-red-50 border-r">Tot</th>
                <th class="px-2 py-1 text-center text-[10px] font-medium text-orange-500 bg-orange-50/50" title="Saída Definitiva">Defin.</th>
                <th class="px-2 py-1 text-center text-[10px] font-medium text-blue-500 bg-blue-50/50" title="Transferência para Loja">Tr.Loja</th>
                <th class="px-2 py-1 text-center text-[10px] font-medium text-violet-500 bg-violet-50/50" title="Transferência para Apoio">Tr.Apoio</th>
                <th class="px-2 py-1 text-center text-[10px] font-medium text-purple-500 bg-purple-50/50 border-r" title="Produção (Beneficiamento)">Prod.</th>
                <th class="px-2 py-1 text-center text-[10px] font-medium text-violet-600 bg-violet-50/60" title="Entradas no Estoque de Apoio">Ent</th>
                <th class="px-2 py-1 text-center text-[10px] font-medium text-violet-600 bg-violet-50/60" title="Saídas do Estoque de Apoio (definitivas)">Saí</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-operacao-200">
              <tr v-if="painelFiltered.length === 0">
                <td :colspan="painelTotalColunas" class="px-3 py-8 text-center text-operacao-400">
                  Nenhum dado encontrado para o período selecionado
                </td>
              </tr>
              <tr v-for="item in painelPaginatedItems" :key="item.produto_id" class="hover:bg-operacao-50">
                <td class="px-2 py-2 text-xs font-medium text-operacao-800 border-r truncate max-w-[120px]" :title="item.produto">{{ item.produto }}</td>
                <td class="px-2 py-2 text-xs text-center text-operacao-500 border-r">{{ painelFormatQtd(item.estoque_inicial) }}</td>
                <td v-for="(_, idx) in painelSemanas" :key="'dent-' + idx" class="px-1 py-2 text-xs text-center text-controle-600 bg-controle-50/50">{{ painelFormatQtd(item.entradas_por_semana[idx]) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-controle-700 bg-controle-100 border-r">{{ painelFormatQtd(item.total_entradas) }}</td>
                <td v-for="(_, idx) in painelSemanas" :key="'dsai-' + idx" class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ painelFormatQtd(item.saidas_por_semana[idx]) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-red-700 bg-red-100 border-r">{{ painelFormatQtd(item.total_saidas) }}</td>
                <td class="px-2 py-2 text-xs text-center font-medium text-guardian-600 border-r">{{ painelFormatQtd(item.estoque_final) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-orange-500 bg-orange-50/30">{{ painelFormatQtd(item.saidas_definitiva) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-blue-500 bg-blue-50/30">{{ painelFormatQtd(item.saidas_transf_loja) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-violet-500 bg-violet-50/30">{{ painelFormatQtd(item.saidas_transf_apoio) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-purple-500 bg-purple-50/30 border-r">{{ painelFormatQtd(item.saidas_beneficiamento) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-violet-600 bg-violet-50/20">{{ painelFormatQtd(item.saidas_transf_apoio) }}</td>
                <td class="px-1 py-2 text-xs text-center font-medium text-violet-400 bg-violet-50/20">-</td>
              </tr>
            </tbody>
            <tfoot class="bg-operacao-100">
              <tr class="font-semibold">
                <td class="px-3 py-2 text-xs text-operacao-600 border-r">TOTAL</td>
                <td class="px-3 py-2 text-xs text-center text-operacao-600 border-r">-</td>
                <td :colspan="painelSemanas.length + 1" class="px-3 py-2 text-xs text-center text-controle-700 border-r bg-controle-100">{{ painelFormatQtd(painelTotais.entradas) }}</td>
                <td :colspan="painelSemanas.length + 1" class="px-3 py-2 text-xs text-center text-red-700 border-r bg-red-100">{{ painelFormatQtd(painelTotais.saidas) }}</td>
                <td class="px-3 py-2 text-xs text-center text-guardian-700 border-r">-</td>
                <td class="px-3 py-2 text-xs text-center font-medium text-orange-600 bg-orange-50">{{ painelFormatQtd(painelTotais.definitiva) }}</td>
                <td class="px-3 py-2 text-xs text-center font-medium text-blue-600 bg-blue-50">{{ painelFormatQtd(painelTotais.transfLoja) }}</td>
                <td class="px-3 py-2 text-xs text-center font-medium text-violet-600 bg-violet-50">{{ painelFormatQtd(painelTotais.transfApoio) }}</td>
                <td class="px-3 py-2 text-xs text-center font-medium text-purple-600 bg-purple-50 border-r">{{ painelFormatQtd(painelTotais.beneficiamento) }}</td>
                <td class="px-3 py-2 text-xs text-center font-medium text-violet-600 bg-violet-50/60">{{ painelFormatQtd(painelTotais.transfApoio) }}</td>
                <td class="px-3 py-2 text-xs text-center font-medium text-violet-400 bg-violet-50/60">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <TablePagination
          v-model="painelPage"
          :page-size="painelPageSize"
          :total-items="painelFiltered.length"
          @update:page-size="painelPageSize = $event"
        />
      </template>
    </template>

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
              <div class="p-2 rounded-lg flex items-center justify-center" :class="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' ? 'bg-blue-100' : tipoSaida === 'transferencia' ? 'bg-guardian-100' : tipoSaida === 'beneficiamento' ? 'bg-purple-100' : 'bg-red-100'">
                <UIcon
                  :name="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' ? 'i-heroicons-building-storefront' : tipoSaida === 'transferencia' ? 'i-heroicons-archive-box' : tipoSaida === 'beneficiamento' ? 'i-heroicons-beaker' : 'i-heroicons-arrow-up-tray'"
                  class="w-5 h-5"
                  :class="tipoSaida === 'transferencia' && destinoTransferencia === 'loja' ? 'text-blue-600' : tipoSaida === 'transferencia' ? 'text-guardian-600' : tipoSaida === 'beneficiamento' ? 'text-purple-600' : 'text-red-600'"
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
              <div class="grid grid-cols-4 gap-1.5">
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
                <button
                  type="button"
                  @click="tipoSaida = 'beneficiamento'; destinoTransferencia = 'apoio'; empresaDestinoId = ''"
                  class="px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                  :class="tipoSaida === 'beneficiamento'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-operacao-200 bg-white text-operacao-400 hover:border-operacao-300'"
                >
                  <UIcon name="i-heroicons-beaker" class="w-3.5 h-3.5 flex-shrink-0" />
                  <span class="truncate">Produção</span>
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
              <UBadge :color="tipoSaida === 'transferencia' ? 'blue' : tipoSaida === 'beneficiamento' ? 'purple' : 'red'" variant="subtle" size="xs" v-if="saidaItens.length > 0">
                {{ saidaItens.length }} {{ saidaItens.length === 1 ? 'item' : 'itens' }}
              </UBadge>
            </div>

            <div class="space-y-3">
              <div
                v-for="(item, index) in saidaItens"
                :key="index"
                class="relative group rounded-xl border border-operacao-200 dark:border-operacao-700 bg-operacao-50/50 dark:bg-operacao-900/30 p-4 transition-all"
                :class="tipoSaida === 'transferencia' ? 'hover:border-guardian-300 hover:shadow-sm' : tipoSaida === 'beneficiamento' ? 'hover:border-purple-300 hover:shadow-sm' : 'hover:border-red-300 hover:shadow-sm'"
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
            <strong>Tipo:</strong> {{ deletingRow?.tipo === 'transferencia' ? 'Transferência' : deletingRow?.tipo === 'beneficiamento' ? 'Produção' : 'Definitiva' }}
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

    <!-- ======================== SLIDEOVER: PRODUÇÕES PENDENTES ======================== -->
    <USlideover
      v-model="showPendentes"
      :ui="{
        width: 'max-w-md',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800'
      }"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200 dark:border-operacao-700">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-purple-100 rounded-lg">
              <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Produções Pendentes</h3>
              <p class="text-xs text-operacao-400">
                {{ pendentesCount }} {{ pendentesCount === 1 ? 'produção aguardando' : 'produções aguardando' }} rendimento
              </p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showPendentes = false" />
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          <div
            v-for="benef in pendentes"
            :key="benef.id"
            class="p-4 rounded-xl border border-operacao-200 hover:border-purple-300 bg-white hover:bg-purple-50/30 transition-all cursor-pointer group"
            @click="openResolucaoFromSlideover(benef)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-operacao-800 truncate">{{ benef.saida?.produto?.nome }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <UBadge color="purple" variant="subtle" size="xs">
                    {{ formatNumber(benef.saida?.quantidade) }} {{ benef.saida?.produto?.unidade?.sigla }}
                  </UBadge>
                  <span class="text-xs text-operacao-400">{{ formatDate(benef.saida?.data) }}</span>
                </div>
                <p class="text-xs text-operacao-400 mt-1.5">Custo: {{ formatCurrency(benef.saida?.custo_saida) }}</p>
              </div>
              <UIcon name="i-heroicons-chevron-right" class="w-5 h-5 text-operacao-300 group-hover:text-purple-500 transition-colors flex-shrink-0 mt-1" />
            </div>
          </div>

          <div v-if="pendentes.length === 0" class="flex flex-col items-center justify-center py-12 text-operacao-400">
            <UIcon name="i-heroicons-check-circle" class="w-10 h-10 mb-3 text-controle-400" />
            <p class="text-sm font-medium text-operacao-400">Tudo resolvido!</p>
            <p class="text-xs text-operacao-400">Nenhuma produção pendente</p>
          </div>
        </div>
      </div>
    </USlideover>

    <!-- ======================== MODAL: INFORMAR RENDIMENTO ======================== -->
    <UModal
      v-model="resolucaoModalOpen"
      :ui="{
        width: 'sm:max-w-2xl',
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
              <div class="p-2 bg-purple-100 rounded-lg flex items-center justify-center">
                <UIcon name="i-heroicons-beaker" class="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-operacao-800">Informar Rendimento</h3>
                <p class="text-sm text-operacao-400">
                  {{ resolvingBeneficiamento?.saida?.produto?.nome }} —
                  {{ formatNumber(resolvingBeneficiamento?.saida?.quantidade) }}
                  {{ resolvingBeneficiamento?.saida?.produto?.unidade?.sigla }}
                </p>
              </div>
            </div>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="resolucaoModalOpen = false" />
          </div>
        </template>

        <div class="space-y-4">
          <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-center justify-between text-sm">
              <span class="text-purple-700">Custo total da saída:</span>
              <span class="font-semibold text-purple-900">{{ formatCurrency(custoRealSaida) }}</span>
            </div>
            <p v-if="eficienciaProdutoOrigem && eficienciaProdutoOrigem < 100" class="text-xs text-purple-500 mt-1">
              Custo original {{ formatCurrency(resolvingBeneficiamento?.saida?.custo_saida) }}
              ajustado pela eficiência de {{ eficienciaProdutoOrigem }}%
            </p>
          </div>

          <div class="space-y-3">
            <span class="text-sm font-medium text-operacao-600">Produtos finais obtidos:</span>
            <div
              v-for="(item, index) in itensResolucao"
              :key="index"
              class="p-4 border border-operacao-200 rounded-lg bg-operacao-50/50"
            >
              <div class="flex items-center gap-3 mb-3">
                <UIcon name="i-heroicons-cube" class="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div>
                  <p class="text-sm font-medium text-operacao-800">{{ item.produto_nome }}</p>
                  <p class="text-xs text-operacao-400">Unidade: {{ item.unidade_sigla }}</p>
                </div>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-xs font-medium text-operacao-400 mb-1">Quantidade</label>
                  <UInput v-model.number="item.quantidade" type="number" step="0.0001" min="0" placeholder="0" size="md" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-operacao-400 mb-1">Peso por un. (kg)</label>
                  <UInput
                    :model-value="formatGramatura(item.gramatura)"
                    @update:model-value="item.gramatura = parseGramatura($event)"
                    placeholder="Ex: 0,150"
                    size="md"
                    inputmode="decimal"
                    :ui="{ icon: { trailing: { pointer: '' } } }"
                  >
                    <template #trailing>
                      <span class="text-operacao-400 text-xs">kg</span>
                    </template>
                  </UInput>
                </div>
                <div>
                  <label class="block text-xs font-medium text-operacao-400 mb-1">Custo unit.</label>
                  <div class="h-[38px] flex items-center px-3 bg-purple-50 border border-purple-200 rounded-md">
                    <span class="text-xs font-semibold text-purple-700">
                      {{ formatCurrency(calcCustoUnitarioResolucao(index)) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="itensResolucao.some(i => i.quantidade > 0)"
            class="p-3 bg-operacao-50 border border-operacao-200 rounded-lg"
          >
            <div class="grid grid-cols-3 gap-3 text-center">
              <div>
                <p class="text-xs text-operacao-400">Qtd. total</p>
                <p class="text-sm font-semibold text-operacao-800">{{ resumoResolucao.qtdTotal }} un</p>
              </div>
              <div>
                <p class="text-xs text-operacao-400">Peso total</p>
                <p class="text-sm font-semibold text-operacao-800">{{ formatNumber(resumoResolucao.pesoTotal) }} kg</p>
              </div>
              <div>
                <p class="text-xs text-operacao-400">Valor total</p>
                <p class="text-sm font-semibold text-purple-700">{{ formatCurrency(resumoResolucao.valorTotal) }}</p>
              </div>
            </div>
          </div>

          <div v-if="itensResolucao.length === 0" class="text-center py-4 text-operacao-400">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 mx-auto mb-2" />
            <p class="text-sm">Nenhum produto final vinculado a este produto.</p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="resolucaoModalOpen = false">Cancelar</UButton>
            <UButton color="purple" class="w-full sm:w-auto" :loading="resolvendo" :disabled="itensResolucao.length === 0" @click="confirmarResolucao">
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              Confirmar Rendimento
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- ======================== SLIDEOVER: PAINEL DE CONTROLE (80%) ======================== -->
    <USlideover
      v-model="showDashboard"
      :ui="{
        width: 'max-w-[80vw]',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-operacao-50 dark:bg-operacao-900'
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200 bg-white dark:bg-operacao-800 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-guardian-100 rounded-lg">
              <UIcon name="i-heroicons-table-cells" class="w-5 h-5 text-guardian-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">Resumo Mensal</h3>
              <p class="text-xs text-operacao-400">Visão consolidada do estoque por produto com CMV</p>
            </div>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="showDashboard = false" />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Resumo Skeleton -->
          <div v-if="painelLoading" class="grid grid-cols-2 gap-3" :class="painelShowCmv ? 'md:grid-cols-4' : 'md:grid-cols-3'">
            <div v-for="i in (painelShowCmv ? 4 : 3)" :key="i" class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
              <div class="space-y-1.5">
                <USkeleton class="h-3 w-20" />
                <USkeleton class="h-5 w-28" />
              </div>
            </div>
          </div>

          <!-- Resumo Geral -->
          <div v-if="!painelLoading" class="grid grid-cols-2 gap-3" :class="painelShowCmv ? 'md:grid-cols-4' : 'md:grid-cols-3'">
            <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-operacao-400" />
                <span class="text-[11px] font-medium text-operacao-400">Estoque Inicial</span>
              </div>
              <p class="text-base font-bold text-operacao-800">{{ formatCurrency(painelResumo.estoqueInicial) }}</p>
            </div>
            <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-controle-400" />
                <span class="text-[11px] font-medium text-operacao-400">Total Entradas</span>
              </div>
              <p class="text-base font-bold text-controle-700">{{ formatCurrency(painelResumo.totalEntradas) }}</p>
            </div>
            <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-guardian-400" />
                <span class="text-[11px] font-medium text-operacao-400">Estoque Total</span>
              </div>
              <p class="text-base font-bold text-guardian-700">{{ formatCurrency(painelResumo.estoqueFinal) }}</p>
            </div>
            <div v-if="painelShowCmv" class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm px-4 py-3">
              <div class="flex items-center gap-1.5 mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span class="text-[11px] font-medium text-operacao-400">{{ painelLabelCmv }}</span>
              </div>
              <p class="text-base font-bold text-orange-600">{{ formatCurrency(painelResumo.cmvTotal) }}</p>
            </div>
          </div>

          <!-- Filtros -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Seletor Mês/Ano (popover estilo inventário) -->
            <UPopover :popper="{ placement: 'bottom-start' }">
              <UButton
                color="white"
                class="w-full sm:w-auto justify-between"
                :ui="toolbarButtonUi"
              >
                <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-operacao-400 mr-2" />
                <span class="text-sm font-normal text-gray-900 capitalize">{{ painelMesAnoLabel }}</span>
              </UButton>
              <template #panel="{ close }">
                <div class="w-64 p-3">
                  <!-- Header com navegação de ano -->
                  <div class="flex items-center justify-between mb-3">
                    <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="painelPickerAno--">
                      <UIcon name="i-heroicons-chevron-left-20-solid" class="w-4 h-4 text-operacao-500" />
                    </button>
                    <span class="text-sm font-semibold text-gray-700">{{ painelPickerAno }}</span>
                    <button class="p-1 rounded hover:bg-operacao-100 transition-colors" @click="painelPickerAno++">
                      <UIcon name="i-heroicons-chevron-right-20-solid" class="w-4 h-4 text-operacao-500" />
                    </button>
                  </div>
                  <!-- Grid de meses -->
                  <div class="grid grid-cols-3 gap-1.5">
                    <button
                      v-for="(nome, idx) in painelMesesNomes"
                      :key="idx"
                      class="px-2 py-1.5 text-sm rounded-md transition-colors capitalize"
                      :class="painelSelectedMes === idx + 1 && painelSelectedAno === painelPickerAno
                        ? 'bg-guardian-600 text-white font-medium'
                        : 'text-operacao-600 hover:bg-operacao-50'"
                      @click="painelSelectMesAno(idx + 1, painelPickerAno); close()"
                    >
                      {{ nome }}
                    </button>
                  </div>
                </div>
              </template>
            </UPopover>

            <!-- Visualização -->
            <div class="flex items-center gap-1.5">
              <div class="flex items-center gap-1">
                <span class="text-xs font-medium text-operacao-400">Visualização</span>
                <UPopover :popper="{ placement: 'top', offsetDistance: 8 }" mode="hover" :open-delay="200" :close-delay="100">
                  <UIcon name="i-heroicons-question-mark-circle" class="w-3.5 h-3.5 text-operacao-400 hover:text-primary-500 cursor-help transition-colors" />
                  <template #panel>
                    <div class="p-3 text-xs space-y-2 max-w-[280px]">
                      <p class="font-semibold text-operacao-800 border-b border-operacao-200 pb-1.5">Modos de Visualização</p>
                      <div class="flex gap-2">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />
                        <div><span class="font-medium text-operacao-700">CMV Consumo:</span> <span class="text-operacao-400">Transf. + Definitiva — custo total das saídas (exceto produção)</span></div>
                      </div>
                      <div class="flex gap-2">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div><span class="font-medium text-operacao-700">Transferência:</span> <span class="text-operacao-400">Apenas movimentações para o estoque de apoio</span></div>
                      </div>
                      <div class="flex gap-2">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div><span class="font-medium text-operacao-700">Definitiva:</span> <span class="text-operacao-400">Apenas saídas finais (consumo, venda, perda)</span></div>
                      </div>
                      <div class="flex gap-2">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                        <div><span class="font-medium text-operacao-700">Produção:</span> <span class="text-operacao-400">Saídas para beneficiamento / industrialização</span></div>
                      </div>
                    </div>
                  </template>
                </UPopover>
              </div>
              <USelect v-model="painelTipoVisualizacao" :options="painelVisualizacaoOptions" class="w-48" :ui="{ color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200' } } }" />
            </div>
          </div>

          <!-- Tabs de Visualização -->
          <div class="flex items-center gap-1 border-b border-operacao-200">
            <button
              v-for="tab in [
                { key: 'visao-geral', label: 'Visão Geral', icon: 'i-heroicons-chart-bar' },
                { key: 'ranking', label: 'Ranking', icon: 'i-heroicons-bars-arrow-down' },
                { key: 'detalhamento', label: 'Detalhamento', icon: 'i-heroicons-table-cells' }
              ]"
              :key="tab.key"
              @click="painelTab = tab.key as any"
              class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
              :class="painelTab === tab.key
                ? 'border-guardian-500 text-guardian-700'
                : 'border-transparent text-operacao-400 hover:text-operacao-600 hover:border-operacao-300'"
            >
              <UIcon :name="tab.icon" class="w-4 h-4" />
              {{ tab.label }}
            </button>
            <!-- Search (disponível em todas as abas) -->
            <div class="ml-auto pb-1.5">
              <UInput v-model="painelSearch" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-56" size="sm" :ui="toolbarInputUi" />
            </div>
          </div>

          <!-- Loading overlay global -->
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <div v-if="painelLoading" class="flex items-center justify-center py-16">
              <div class="flex flex-col items-center gap-2">
                <div class="w-8 h-8 border-[3px] border-operacao-200 border-t-primary-500 rounded-full animate-spin" />
                <span class="text-sm text-operacao-400 font-medium">Carregando dados...</span>
              </div>
            </div>
          </Transition>

          <!-- ====== TAB: VISÃO GERAL ====== -->
          <div v-if="!painelLoading && painelTab === 'visao-geral'" class="space-y-6">
            <!-- Gráfico Semanal: Entradas vs Saídas -->
            <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm p-5">
              <h4 class="text-sm font-semibold text-operacao-700 mb-4">Entradas vs Saídas por Semana</h4>
              <div v-if="painelSemanalAgg.length === 0" class="text-center py-8 text-operacao-400 text-sm">
                Nenhum dado para o período
              </div>
              <div v-else class="space-y-4">
                <div v-for="sem in painelSemanalAgg" :key="sem.label" class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs text-operacao-500">
                    <span class="font-medium text-operacao-700 w-8">{{ sem.label }}</span>
                    <span class="text-[10px] text-operacao-400">{{ sem.tooltip }}</span>
                  </div>
                  <!-- Barra Entradas -->
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-controle-500 w-14 text-right">Entradas</span>
                    <div class="flex-1 h-5 bg-operacao-50 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-controle-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        :style="{ width: `${Math.max((sem.entradas / painelSemanalMax) * 100, sem.entradas > 0 ? 8 : 0)}%` }"
                      >
                        <span v-if="sem.entradas > 0" class="text-[10px] font-bold text-white whitespace-nowrap">{{ formatCurrency(sem.entradas) }}</span>
                      </div>
                    </div>
                  </div>
                  <!-- Barra Saídas -->
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] text-red-500 w-14 text-right">Saídas</span>
                    <div class="flex-1 h-5 bg-operacao-50 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-red-400 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        :style="{ width: `${Math.max((sem.saidas / painelSemanalMax) * 100, sem.saidas > 0 ? 8 : 0)}%` }"
                      >
                        <span v-if="sem.saidas > 0" class="text-[10px] font-bold text-white whitespace-nowrap">{{ formatCurrency(sem.saidas) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Produtos (movers) -->
            <div class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm p-5">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-sm font-semibold text-operacao-700">Produtos com Maior Saída</h4>
                <span class="text-[11px] text-operacao-400">por valor (R$)</span>
              </div>
              <div v-if="painelTopMovers.length === 0" class="text-center py-8 text-operacao-400 text-sm">
                Nenhuma saída no período
              </div>
              <div v-else class="space-y-2.5">
                <div v-for="(item, idx) in painelTopMovers" :key="item.produto" class="group">
                  <div class="flex items-center gap-3">
                    <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      :class="idx < 3 ? 'bg-orange-100 text-orange-700' : 'bg-operacao-100 text-operacao-500'"
                    >{{ idx + 1 }}</span>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-baseline justify-between gap-2 mb-1">
                        <span class="text-sm font-medium text-operacao-800 truncate">{{ item.produto }}</span>
                        <span class="text-xs font-bold text-red-600 whitespace-nowrap">{{ formatCurrency(item.valor_saidas) }}</span>
                      </div>
                      <div class="h-2 bg-operacao-50 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-500"
                          :class="idx < 3 ? 'bg-orange-400' : 'bg-operacao-300'"
                          :style="{ width: `${(item.valor_saidas / painelRankingMax) * 100}%` }"
                        />
                      </div>
                      <div class="flex items-center gap-3 mt-1 text-[10px] text-operacao-400">
                        <span>{{ painelFormatQtd(item.total_saidas) }} {{ item.unidade }}</span>
                        <span>Custo unit.: {{ formatCurrency(item.custo) }}</span>
                        <span v-if="item.categoria">{{ item.categoria }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ====== TAB: RANKING ====== -->
          <div v-if="!painelLoading && painelTab === 'ranking'" class="space-y-4">
            <div v-if="painelRanking.length === 0" class="text-center py-16 text-operacao-400">
              <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 mx-auto mb-2 text-operacao-300" />
              <p class="text-sm">Nenhum produto com movimentação no período</p>
            </div>
            <div v-else class="rounded-lg bg-white ring-1 ring-[#EBEBED] shadow-sm overflow-hidden">
              <table class="min-w-full">
                <thead class="bg-operacao-50">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider w-8">#</th>
                    <th class="px-3 py-2 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Produto</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Saídas (qtd)</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Saídas (R$)</th>
                    <th class="px-3 py-2 text-xs font-medium text-[#5a5a66] uppercase tracking-wider w-[30%]">Participação</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Entradas (R$)</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-[#5a5a66] uppercase tracking-wider">Estoque Final (R$)</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-operacao-100">
                  <tr v-for="(item, idx) in painelRanking" :key="item.produto" class="hover:bg-operacao-50/50">
                    <td class="px-3 py-2.5">
                      <span class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        :class="idx < 3 ? 'bg-orange-100 text-orange-700' : 'bg-operacao-100 text-operacao-500'"
                      >{{ idx + 1 }}</span>
                    </td>
                    <td class="px-3 py-2.5">
                      <div class="text-sm font-medium text-operacao-800">{{ item.produto }}</div>
                      <div class="text-[10px] text-operacao-400">{{ item.categoria }}</div>
                    </td>
                    <td class="px-3 py-2.5 text-right text-sm text-operacao-600">{{ painelFormatQtd(item.total_saidas) }} <span class="text-[10px] text-operacao-400">{{ item.unidade }}</span></td>
                    <td class="px-3 py-2.5 text-right text-sm font-semibold text-red-600">{{ formatCurrency(item.valor_saidas) }}</td>
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2.5 bg-operacao-50 rounded-full overflow-hidden">
                          <div
                            class="h-full rounded-full transition-all duration-500"
                            :class="idx < 3 ? 'bg-orange-400' : 'bg-operacao-300'"
                            :style="{ width: `${(item.valor_saidas / painelRankingMax) * 100}%` }"
                          />
                        </div>
                        <span class="text-[10px] font-medium text-operacao-500 w-9 text-right">{{ painelResumo.cmvTotal > 0 ? ((item.valor_saidas / painelResumo.cmvTotal) * 100).toFixed(1) : '0' }}%</span>
                      </div>
                    </td>
                    <td class="px-3 py-2.5 text-right text-sm text-controle-600">{{ formatCurrency(item.valor_entradas) }}</td>
                    <td class="px-3 py-2.5 text-right text-sm text-guardian-600">{{ formatCurrency(item.valor_total) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ====== TAB: DETALHAMENTO (tabela matricial original) ====== -->
          <div v-if="!painelLoading && painelTab === 'detalhamento'">
            <div class="relative overflow-x-auto">
              <table class="min-w-full divide-y divide-operacao-200">
                <thead class="bg-operacao-50">
                  <tr>
                    <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r">Produto</th>
                    <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r">E.I.</th>
                    <th :colspan="painelSemanas.length + 1" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r bg-controle-50">Entradas</th>
                    <th :colspan="painelSemanas.length + 1" class="px-3 py-2 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r bg-red-50">Saídas</th>
                    <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r">E.F.</th>
                    <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r">C.Unit</th>
                    <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider border-r">Est. Total</th>
                    <th v-if="painelShowCmv" rowspan="2" class="px-3 py-3 text-center text-xs font-medium text-[#5a5a66] uppercase tracking-wider bg-orange-50">{{ painelLabelCmv }}</th>
                  </tr>
                  <tr>
                    <th v-for="sem in painelSemanas" :key="'ent-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-controle-50">
                      <MiniCalendar :mes="painelSelectedMes" :ano="painelSelectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                        {{ sem.label }}
                      </MiniCalendar>
                    </th>
                    <th class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-controle-50 border-r">Tot</th>
                    <th v-for="sem in painelSemanas" :key="'sai-' + sem.label" class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-red-50">
                      <MiniCalendar :mes="painelSelectedMes" :ano="painelSelectedAno" :data-inicio="sem.inicio" :data-fim="sem.fim">
                        {{ sem.label }}
                      </MiniCalendar>
                    </th>
                    <th class="px-2 py-1 text-center text-xs font-medium text-[#5a5a66] bg-red-50 border-r">Tot</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-operacao-200">
                  <tr v-if="painelFiltered.length === 0">
                    <td :colspan="painelTotalColunas" class="px-3 py-8 text-center text-operacao-400">
                      Nenhum dado encontrado para o período selecionado
                    </td>
                  </tr>
                  <tr v-for="item in painelPaginatedItems" :key="item.produto_id" class="hover:bg-operacao-50">
                    <td class="px-2 py-2 text-xs font-medium text-operacao-800 border-r truncate max-w-[120px]" :title="item.produto">{{ item.produto }}</td>
                    <td class="px-2 py-2 text-xs text-center text-operacao-500 border-r">{{ painelFormatQtd(item.estoque_inicial) }}</td>
                    <td v-for="(_, idx) in painelSemanas" :key="'ent-' + idx" class="px-1 py-2 text-xs text-center text-controle-600 bg-controle-50/50">{{ painelFormatQtd(item.entradas_por_semana[idx]) }}</td>
                    <td class="px-1 py-2 text-xs text-center font-medium text-controle-700 bg-controle-100 border-r">{{ painelFormatQtd(item.total_entradas) }}</td>
                    <td v-for="(_, idx) in painelSemanas" :key="'sai-' + idx" class="px-1 py-2 text-xs text-center text-red-600 bg-red-50/50">{{ painelFormatQtd(item.saidas_por_semana[idx]) }}</td>
                    <td class="px-1 py-2 text-xs text-center font-medium text-red-700 bg-red-100 border-r">{{ painelFormatQtd(item.total_saidas) }}</td>
                    <td class="px-2 py-2 text-xs text-center font-medium text-guardian-600 border-r">{{ painelFormatQtd(item.estoque_final) }}</td>
                    <td class="px-2 py-2 text-xs text-center text-operacao-500 border-r">{{ painelFormatCurrencyShort(item.custo) }}</td>
                    <td class="px-2 py-2 text-xs text-center font-medium text-operacao-800 border-r">{{ painelFormatCurrencyShort(item.valor_total) }}</td>
                    <td v-if="painelShowCmv" class="px-2 py-2 text-xs text-center font-medium text-orange-600 bg-orange-50/50">{{ painelFormatCurrencyShort(item.cmv || 0) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-operacao-100">
                  <tr class="font-semibold">
                    <td class="px-3 py-2 text-xs text-operacao-600 border-r">TOTAL</td>
                    <td class="px-3 py-2 text-xs text-center text-operacao-600 border-r">-</td>
                    <td :colspan="painelSemanas.length + 1" class="px-3 py-2 text-xs text-center text-controle-700 border-r bg-controle-100">{{ painelFormatQtd(painelTotais.entradas) }}</td>
                    <td :colspan="painelSemanas.length + 1" class="px-3 py-2 text-xs text-center text-red-700 border-r bg-red-100">{{ painelFormatQtd(painelTotais.saidas) }}</td>
                    <td class="px-3 py-2 text-xs text-center text-guardian-700 border-r">-</td>
                    <td class="px-3 py-2 text-xs text-center text-operacao-600 border-r">-</td>
                    <td class="px-3 py-2 text-xs text-center text-operacao-800 border-r">{{ painelFormatCurrencyShort(painelTotais.valor) }}</td>
                    <td v-if="painelShowCmv" class="px-3 py-2 text-xs text-center text-orange-700 bg-orange-100">{{ painelFormatCurrencyShort(painelTotais.cmv) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <TablePagination
              v-model="painelPage"
              :page-size="painelPageSize"
              :total-items="painelFiltered.length"
              @update:page-size="painelPageSize = $event"
            />
          </div>
        </div>
      </div>
    </USlideover>

  </div>
</template>

<script setup lang="ts">
import type { Entrada, Saida, Produto, TipoSaida, Beneficiamento, PainelMes, SemanaInfo } from '~/types'
import { DatePicker as VDatePicker } from 'v-calendar'

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
  createSaidaBeneficiamento,
  getProdutos,
  getSaldoProduto,
  getBeneficiamentosPendentes,
  countBeneficiamentosPendentes,
  resolverBeneficiamento,
  getProdutosBeneficiamento
} = useEstoque()
const { empresaId, empresaAtiva, empresas } = useEmpresa()
const { formatCurrency, formatNumber } = useFormatters()
const toast = useToast()

// Painel de Controle composable
const { getPainelMes } = useRelatorios()

// ======================== STATE: PAGE ========================

const entradas = ref<Entrada[]>([])
const saidas = ref<Saida[]>([])
const produtos = ref<Produto[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const hoje = new Date()
const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
const dateRange = ref<{ start: Date | null; end: Date | null }>({ start: primeiroDiaMes, end: ultimoDiaMes })
const dateRangeClickCount = ref(0)
const filtroTipo = ref('')

// Computed: filtroDataInicio / filtroDataFim (YYYY-MM-DD strings para compatibilidade)
const filtroDataInicio = computed(() => {
  if (!dateRange.value.start) return ''
  const d = new Date(dateRange.value.start)
  return d.toISOString().slice(0, 10)
})
const filtroDataFim = computed(() => {
  if (!dateRange.value.end) return ''
  const d = new Date(dateRange.value.end)
  return d.toISOString().slice(0, 10)
})

const dateRangeLabel = computed(() => {
  if (!dateRange.value.start) return 'Selecionar período'
  const fmt = (d: Date) => {
    const dt = new Date(d)
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
  if (!dateRange.value.end || dateRange.value.start.getTime() === dateRange.value.end.getTime()) {
    return fmt(dateRange.value.start)
  }
  return `${fmt(dateRange.value.start)} — ${fmt(dateRange.value.end)}`
})

const hasActiveFilters = computed(() => {
  return !!dateRange.value.start || !!filtroTipo.value || !!search.value
})

const onDayClick = (closeFn: () => void) => {
  dateRangeClickCount.value++
  if (dateRangeClickCount.value >= 2) {
    dateRangeClickCount.value = 0
    setTimeout(() => closeFn(), 200)
  }
}

// ======================== STATE: MODALS ========================

const entradaModalOpen = ref(false)
const saidaModalOpen = ref(false)
const deleteModalOpen = ref(false)
const confirmDefinitivaOpen = ref(false)
const viewMode = ref<'historico' | 'detalhamento'>('historico')
const viewModeOptions = [
  { key: 'historico', icon: 'i-heroicons-clock', label: 'Histórico' },
  { key: 'detalhamento', icon: 'i-heroicons-table-cells', label: 'Mapa Visual' }
]
const showDashboard = ref(false)
const showPendentes = ref(false)
const resolucaoModalOpen = ref(false)

// ======================== STATE: PAINEL DE CONTROLE ========================

const painelData = ref<PainelMes[]>([])
const painelSemanas = ref<SemanaInfo[]>([])
const painelLoading = ref(false)
const painelSearch = ref('')
// painelTipoVisualizacao mantido para compatibilidade com slideover legado
const painelTipoVisualizacao = ref<'todos' | 'transferencia' | 'definitiva' | 'beneficiamento'>('todos')
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
const painelTab = ref<'visao-geral' | 'ranking' | 'detalhamento'>('visao-geral')

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

// ======================== STATE: BENEFICIAMENTO ========================

const pendentes = ref<Beneficiamento[]>([])
const pendentesCount = ref(0)
const resolvingBeneficiamento = ref<Beneficiamento | null>(null)
const itensResolucao = ref<Array<{
  produto_final_id: string
  produto_nome: string
  unidade_sigla: string
  quantidade: number
  gramatura: number
}>>([])
const resolvendo = ref(false)

// ======================== TABLE COLUMNS ========================

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'tipoDisplay', label: 'Tipo' },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'valor', label: 'Valor' },
  { key: 'numero_nf', label: 'NF' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const tipoFilterOptions = [
  { label: 'Todos', value: '' },
  { label: 'Entrada', value: 'entrada' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Definitiva', value: 'definitiva' },
  { label: 'Produção', value: 'beneficiamento' }
]

const tipoFilterLabel = computed(() => {
  const opt = tipoFilterOptions.find(o => o.value === filtroTipo.value)
  return opt?.label || 'Todos'
})

// ======================== DROPDOWN OPTIONS ========================

const addMovimentoOptions = [[
  { label: 'Entrada', icon: 'i-heroicons-arrow-down-tray', click: () => openEntradaModal() },
  { label: 'Saída', icon: 'i-heroicons-arrow-up-tray', click: () => openSaidaModal() }
]]

// ======================== COMPUTED: UNIFIED DATA ========================

const movimentos = computed(() => {
  const entradasMapped = entradas.value.map(e => ({
    id: e.id,
    _tipoMov: 'entrada' as const,
    data: e.data,
    produto: e.produto,
    produto_id: e.produto_id,
    quantidade: e.quantidade,
    valor: e.valor_total,
    custo_unitario: e.custo_unitario,
    numero_nf: e.numero_nf,
    semana: (e as any).semana,
    tipo: null as TipoSaida | null,
    _entradaOriginal: e,
    _saidaOriginal: null as Saida | null
  }))

  const saidasMapped = saidas.value.map(s => ({
    id: s.id,
    _tipoMov: 'saida' as const,
    data: s.data,
    produto: s.produto,
    produto_id: s.produto_id,
    quantidade: s.quantidade,
    valor: Number(s.custo_saida) || 0,
    custo_unitario: null as number | null,
    numero_nf: null as string | null,
    semana: (s as any).semana,
    tipo: s.tipo,
    empresa_destino: s.empresa_destino || null,
    _entradaOriginal: null as Entrada | null,
    _saidaOriginal: s
  }))

  return [...entradasMapped, ...saidasMapped].sort((a, b) => {
    const dateDiff = new Date(b.data).getTime() - new Date(a.data).getTime()
    if (dateDiff !== 0) return dateDiff
    // Mesma data: mais recente (created_at) primeiro
    const ca = a._entradaOriginal?.created_at || a._saidaOriginal?.created_at || ''
    const cb = b._entradaOriginal?.created_at || b._saidaOriginal?.created_at || ''
    return cb.localeCompare(ca)
  })
})

const filteredMovimentos = computed(() => {
  let result = movimentos.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(m =>
      m.produto?.nome?.toLowerCase().includes(term) ||
      m.produto?.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  if (filtroTipo.value) {
    if (filtroTipo.value === 'entrada') {
      result = result.filter(m => m._tipoMov === 'entrada')
    } else {
      result = result.filter(m => m._tipoMov === 'saida' && m.tipo === filtroTipo.value)
    }
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredMovimentos)

// ======================== COMPUTED: KPIs ========================

const totalEntradas = computed(() =>
  filteredMovimentos.value
    .filter(m => m._tipoMov === 'entrada')
    .reduce((sum, m) => sum + Number(m.valor), 0)
)

const totalSaidas = computed(() =>
  filteredMovimentos.value
    .filter(m => m._tipoMov === 'saida')
    .reduce((sum, m) => sum + Number(m.valor), 0)
)

const saldoPeriodo = computed(() => totalEntradas.value - totalSaidas.value)

const totalEntradaItens = computed(() =>
  entradaItens.value.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0)
)

// ======================== COMPUTED: PRODUTO SELECTS ========================

const produtosSelect = computed(() =>
  produtos.value.map(p => ({
    label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
    value: p.id
  }))
)

const produtosSelectBeneficiamento = computed(() =>
  produtos.value
    .filter(p => p.beneficiavel)
    .map(p => ({
      label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
      value: p.id
    }))
)

const produtosSelectSaida = computed(() =>
  tipoSaida.value === 'beneficiamento' ? produtosSelectBeneficiamento.value : produtosSelect.value
)

const outrasEmpresas = computed(() =>
  empresas.value
    .filter(e => e.id !== empresaId.value && e.ativo)
    .map(e => ({ label: e.nome, value: e.id }))
)

const saidaItensValidosConfirmacao = computed(() =>
  saidaItens.value.filter(item => item.produto_id)
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

const getTipoBadgeColor = (row: any) => {
  if (row._tipoMov === 'entrada') return 'green' as const
  if (row.tipo === 'transferencia') return 'blue' as const
  if (row.tipo === 'beneficiamento') return 'purple' as const
  return 'red' as const
}

const getTipoLabel = (row: any): string => {
  if (row._tipoMov === 'entrada') return 'Entrada'
  if (row.tipo === 'transferencia') {
    if (row.empresa_destino) return `→ ${row.empresa_destino.nome}`
    return 'Transferência'
  }
  if (row.tipo === 'beneficiamento') return 'Produção'
  return 'Definitiva'
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
    console.error('Erro ao carregar saldo:', error)
    saldosCache.value.set(produtoId, 0)
  }
}

const formatGramatura = (value: number) => {
  if (!value) return ''
  return String(value).replace('.', ',')
}

const parseGramatura = (value: string): number => {
  if (!value) return 0
  const cleaned = value.replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

// ======================== LOAD FUNCTIONS ========================

const loadEntradas = async () => {
  try {
    entradas.value = await getEntradas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar entradas', color: 'red' })
  }
}

const loadSaidas = async () => {
  try {
    saidas.value = await getSaidas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar saídas', color: 'red' })
  }
}

const loadProdutos = async () => {
  try {
    produtos.value = await getProdutos()
  } catch (error) {
    console.error('Erro ao carregar produtos:', error)
  }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([loadEntradas(), loadSaidas(), loadProdutos(), loadPendentes()])
  loading.value = false
}

const clearFilters = () => {
  search.value = ''
  dateRange.value = { start: null, end: null }
  dateRangeClickCount.value = 0
  filtroTipo.value = ''
  loadEntradas()
  loadSaidas()
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
    }
    entradaModalOpen.value = false
    await loadEntradas()
    viewMode.value = 'historico'
    page.value = 1
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
        if (tipoSaida.value === 'beneficiamento') {
          await createSaidaBeneficiamento({
            produto_id: item.produto_id,
            tipo: 'beneficiamento',
            data: saidaFormData.value,
            quantidade: item.quantidade,
            observacao: item.observacao || undefined
          })
        } else if (isTransferenciaLoja) {
          await createSaidaTransferenciaLoja({
            produto_id: item.produto_id,
            data: saidaFormData.value,
            quantidade: item.quantidade,
            observacao: item.observacao || undefined
          }, empresaDestinoId.value, item.produto_destino_id)
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
          ? `Transferência enviada para ${nomeDestino}. Entrada criada automaticamente.`
          : itensValidos.length > 1
          ? `${itensValidos.length} saídas registradas com sucesso`
          : tipoSaida.value === 'beneficiamento'
          ? 'Saída de produção registrada. Informe o rendimento nas Produções Pendentes.'
          : 'Saída registrada com sucesso',
        color: 'green'
      })
    }
    confirmDefinitivaOpen.value = false
    saidaModalOpen.value = false
    await Promise.all([loadSaidas(), loadPendentes()])
    viewMode.value = 'historico'
    page.value = 1
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar saída', color: 'red' })
  } finally {
    saving.value = false
  }
}

// ======================== DELETE ========================

const editRow = (row: any) => {
  if (row._tipoMov === 'entrada') {
    openEntradaModal(row._entradaOriginal)
  } else {
    openSaidaModal(row._saidaOriginal)
  }
}

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
      await loadEntradas()
    } else {
      await removeSaida(deletingRow.value.id)
      toast.add({ title: 'Sucesso', description: 'Saída excluída com sucesso', color: 'green' })
      await loadSaidas()
    }
    deleteModalOpen.value = false
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao excluir', color: 'red' })
  } finally {
    deleting.value = false
  }
}

// ======================== BENEFICIAMENTO ========================

const eficienciaProdutoOrigem = computed(() =>
  resolvingBeneficiamento.value?.saida?.produto?.eficiencia_beneficiamento || null
)

const custoRealSaida = computed(() => {
  const custoOriginal = Number(resolvingBeneficiamento.value?.saida?.custo_saida) || 0
  const eficiencia = eficienciaProdutoOrigem.value
  if (!eficiencia || eficiencia >= 100) return custoOriginal
  return custoOriginal / (eficiencia / 100)
})

const custoPorKg = computed(() => {
  const qtdSaida = Number(resolvingBeneficiamento.value?.saida?.quantidade) || 0
  if (qtdSaida <= 0) return 0
  return custoRealSaida.value / qtdSaida
})

const resumoResolucao = computed(() => {
  const qtdTotal = itensResolucao.value.reduce((sum, i) => sum + (i.quantidade || 0), 0)
  const pesoTotal = itensResolucao.value.reduce((sum, i) => sum + ((i.gramatura || 0) * (i.quantidade || 0)), 0)
  const valorTotal = itensResolucao.value.reduce((sum, i, idx) => sum + (calcCustoUnitarioResolucao(idx) * (i.quantidade || 0)), 0)
  return { qtdTotal, pesoTotal, valorTotal }
})

const calcCustoUnitarioResolucao = (index: number) => {
  const item = itensResolucao.value[index]
  if (!item || !item.gramatura) return 0
  return custoPorKg.value * item.gramatura
}

const loadPendentes = async () => {
  try {
    pendentesCount.value = await countBeneficiamentosPendentes()
    pendentes.value = pendentesCount.value > 0 ? await getBeneficiamentosPendentes() : []
  } catch (error) {
    console.error('Erro ao carregar beneficiamentos pendentes:', error)
  }
}

const openResolucaoFromSlideover = (benef: Beneficiamento) => {
  showPendentes.value = false
  setTimeout(() => openResolucao(benef), 300)
}

const openResolucao = async (benef: Beneficiamento) => {
  resolvingBeneficiamento.value = benef
  try {
    const produtoOrigemId = benef.saida?.produto_id
    if (!produtoOrigemId) return
    const vinculos = await getProdutosBeneficiamento(produtoOrigemId)
    itensResolucao.value = vinculos.map((v: any) => ({
      produto_final_id: v.produto_final?.id || v.produto_final_id,
      produto_nome: v.produto_final?.nome || 'Produto',
      unidade_sigla: v.produto_final?.unidade?.sigla || '',
      quantidade: 0,
      gramatura: 0
    }))
  } catch (error) {
    console.error('Erro ao carregar produtos finais:', error)
    itensResolucao.value = []
  }
  resolucaoModalOpen.value = true
}

const confirmarResolucao = async () => {
  if (!resolvingBeneficiamento.value) return
  const itensValidos = itensResolucao.value.filter(i => i.quantidade > 0)
  if (itensValidos.length === 0) {
    toast.add({ title: 'Atenção', description: 'Informe a quantidade de pelo menos um produto final', color: 'amber' })
    return
  }
  try {
    resolvendo.value = true
    await resolverBeneficiamento(
      resolvingBeneficiamento.value.id,
      resolvingBeneficiamento.value.saida!,
      itensValidos.map((i, idx) => {
        const originalIndex = itensResolucao.value.findIndex(ir => ir.produto_final_id === i.produto_final_id)
        return {
          produto_final_id: i.produto_final_id,
          quantidade: i.quantidade,
          gramatura: i.gramatura || undefined,
          custo_unitario: calcCustoUnitarioResolucao(originalIndex >= 0 ? originalIndex : idx)
        }
      })
    )
    toast.add({ title: 'Sucesso', description: 'Produção resolvida! Entradas dos produtos finais criadas com sucesso.', color: 'green' })
    resolucaoModalOpen.value = false
    await Promise.all([loadPendentes(), loadEntradas()])
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao resolver produção', color: 'red' })
  } finally {
    resolvendo.value = false
  }
}

// ======================== PAINEL DE CONTROLE: COMPUTED ========================

// Colunas da tabela: Produto + E.I. + (semanas+tot)*2 entradas/saídas + E.F. + 4 breakdown + 2 est.apoio
const painelTotalColunas = computed(() => 2 + (painelSemanas.value.length + 1) * 2 + 1 + 4 + 2)

const painelFiltered = computed(() => {
  const term = (search.value || painelSearch.value || '').toLowerCase()
  if (!term) return painelData.value
  return painelData.value.filter(p =>
    p.produto.toLowerCase().includes(term) ||
    p.categoria.toLowerCase().includes(term)
  )
})

const painelPaginatedItems = computed(() => {
  const start = (painelPage.value - 1) * painelPageSize.value
  const end = start + painelPageSize.value
  return painelFiltered.value.slice(start, end)
})

const painelResumo = computed(() => {
  const data = painelFiltered.value
  return {
    estoqueInicial: data.reduce((sum, p) => sum + (p.estoque_inicial * p.custo), 0),
    totalEntradas: data.reduce((sum, p) => sum + (p.total_entradas * p.custo), 0),
    totalSaidas: data.reduce((sum, p) => sum + (p.total_saidas * p.custo), 0),
    estoqueFinal: data.reduce((sum, p) => sum + p.valor_total, 0),
    cmvTotal: data.reduce((sum, p) => sum + (p.cmv || 0), 0)
  }
})

const painelTotais = computed(() => {
  const data = painelFiltered.value
  return {
    saidas: data.reduce((sum, p) => sum + p.total_saidas, 0),
    entradas: data.reduce((sum, p) => sum + p.total_entradas, 0),
    valor: data.reduce((sum, p) => sum + p.valor_total, 0),
    cmv: data.reduce((sum, p) => sum + (p.cmv || 0), 0),
    definitiva: data.reduce((sum, p) => sum + (p.saidas_definitiva || 0), 0),
    transfLoja: data.reduce((sum, p) => sum + (p.saidas_transf_loja || 0), 0),
    transfApoio: data.reduce((sum, p) => sum + (p.saidas_transf_apoio || 0), 0),
    beneficiamento: data.reduce((sum, p) => sum + (p.saidas_beneficiamento || 0), 0)
  }
})

// Waterfall Flow — dados consolidados para o painel visual
const painelFluxo = computed(() => {
  const data = painelFiltered.value
  const estoqueInicial = data.reduce((sum, p) => sum + p.estoque_inicial, 0)
  const totalEntradas = data.reduce((sum, p) => sum + p.total_entradas, 0)
  const totalSaidas = data.reduce((sum, p) => sum + p.total_saidas, 0)
  const estoqueFinal = data.reduce((sum, p) => sum + p.estoque_final, 0)
  const definitiva = data.reduce((sum, p) => sum + (p.saidas_definitiva || 0), 0)
  const transfLoja = data.reduce((sum, p) => sum + (p.saidas_transf_loja || 0), 0)
  const transfApoio = data.reduce((sum, p) => sum + (p.saidas_transf_apoio || 0), 0)
  const beneficiamento = data.reduce((sum, p) => sum + (p.saidas_beneficiamento || 0), 0)
  const totalSaidasAll = definitiva + transfLoja + transfApoio + beneficiamento

  const pct = (v: number) => totalSaidasAll > 0 ? (v / totalSaidasAll) * 100 : 0

  return {
    estoqueInicial,
    estoqueInicialValor: data.reduce((sum, p) => sum + (p.estoque_inicial * p.custo), 0),
    totalEntradas,
    totalEntradasValor: data.reduce((sum, p) => sum + (p.total_entradas * p.custo), 0),
    totalSaidas,
    totalSaidasValor: data.reduce((sum, p) => sum + (p.total_saidas * p.custo), 0),
    estoqueFinal,
    estoqueFinalValor: data.reduce((sum, p) => sum + p.valor_total, 0),
    totalSaidasAll,
    definitiva,
    transfLoja,
    transfApoio,
    beneficiamento,
    pctDefinitiva: pct(definitiva),
    pctTransfLoja: pct(transfLoja),
    pctTransfApoio: pct(transfApoio),
    pctBeneficiamento: pct(beneficiamento)
  }
})

const painelFormatNumber = (value: number) => {
  if (!value || value === 0) return '0'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value)
}

// ======================== PAINEL: VISÃO GERAL (dados para gráficos CSS) ========================

const painelSemanalAgg = computed(() => {
  const data = painelFiltered.value
  return painelSemanas.value.map((sem, idx) => {
    const entradas = data.reduce((s, p) => s + ((p.entradas_por_semana[idx] || 0) * p.custo), 0)
    const saidas = data.reduce((s, p) => s + ((p.saidas_por_semana[idx] || 0) * p.custo), 0)
    return { label: sem.label, tooltip: sem.tooltip, entradas, saidas }
  })
})

const painelSemanalMax = computed(() => {
  let max = 0
  painelSemanalAgg.value.forEach(s => { max = Math.max(max, s.entradas, s.saidas) })
  return max || 1
})

const painelRanking = computed(() => {
  return [...painelFiltered.value]
    .map(p => ({
      produto: p.produto,
      categoria: p.categoria,
      unidade: p.unidade,
      total_saidas: p.total_saidas,
      total_entradas: p.total_entradas,
      valor_saidas: p.total_saidas * p.custo,
      valor_entradas: p.total_entradas * p.custo,
      custo: p.custo,
      cmv: p.cmv || 0,
      estoque_final: p.estoque_final,
      valor_total: p.valor_total
    }))
    .filter(p => p.total_saidas > 0 || p.total_entradas > 0)
    .sort((a, b) => b.valor_saidas - a.valor_saidas)
})

const painelRankingMax = computed(() => painelRanking.value[0]?.valor_saidas || 1)

const painelTopMovers = computed(() => painelRanking.value.slice(0, 8))

// Stubs para compatibilidade com slideover legado
const painelVisualizacaoOptions = [
  { label: 'CMV Consumo', value: 'todos' },
  { label: 'Transferência', value: 'transferencia' },
  { label: 'Definitiva', value: 'definitiva' },
  { label: 'Produção', value: 'beneficiamento' }
]
const painelShowCmv = computed(() => painelTipoVisualizacao.value !== 'beneficiamento')
const painelLabelCmv = computed(() => {
  switch (painelTipoVisualizacao.value) {
    case 'transferencia': return 'Valor Transferência'
    case 'definitiva': return 'Valor Definitiva'
    default: return 'CMV Consumo'
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

const painelFormatCurrencyShort = (value: number) => {
  if (!value || value === 0) return '-'
  return formatCurrency(value)
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

// ======================== WATCHERS ========================

watch([painelSelectedMes, painelSelectedAno], () => {
  loadPainel()
})

watch(showDashboard, (val) => {
  if (val && painelData.value.length === 0) {
    loadPainel()
  }
})

watch(viewMode, (val) => {
  if (val === 'detalhamento' && painelData.value.length === 0) {
    loadPainel()
  }
})

watch([filtroDataInicio, filtroDataFim], () => {
  loadEntradas()
  loadSaidas()
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
    console.error('Erro ao carregar produtos destino:', e)
  } finally {
    loadingProdutosDestino.value = false
  }
})

watch(empresaId, () => {
  if (empresaId.value) loadAll()
}, { immediate: true })
</script>
