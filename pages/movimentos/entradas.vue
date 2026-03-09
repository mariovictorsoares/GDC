<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
      <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Entradas</h1>
      <div class="flex gap-2">
        <UButton
          v-if="pendentesTransfCount > 0"
          color="blue"
          variant="soft"
          class="w-full sm:w-auto"
          @click="showPendentesTransf = true"
        >
          <UIcon name="i-heroicons-truck" class="w-4 h-4 mr-2" />
          Transferências Pendentes
          <UBadge color="blue" variant="solid" size="xs" class="ml-1.5">
            {{ pendentesTransfCount }}
          </UBadge>
        </UButton>
        <UButton
          v-if="pendentesCount > 0"
          color="purple"
          variant="soft"
          class="w-full sm:w-auto"
          @click="showPendentes = true"
        >
          <UIcon name="i-heroicons-beaker" class="w-4 h-4 mr-2" />
          Produções Pendentes
          <UBadge color="purple" variant="solid" size="xs" class="ml-1.5">
            {{ pendentesCount }}
          </UBadge>
        </UButton>
        <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Nova Entrada
        </UButton>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
        <UInput v-model="filtroDataInicio" type="date" class="w-full sm:w-40" :ui="toolbarInputUi" />
        <UInput v-model="filtroDataFim" type="date" class="w-full sm:w-40" :ui="toolbarInputUi" />
        <UInput v-model="search" placeholder="Buscar produto..." icon="i-heroicons-magnifying-glass" class="w-full sm:w-44" :ui="toolbarInputUi" />
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <UButton color="white" :ui="toolbarButtonUi" @click="clearFilters">
          Limpar Filtros
        </UButton>
      </div>
    </div>

    <!-- Resumo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-controle-400" />
          <span class="text-xs font-medium text-operacao-400">Total de Entradas</span>
        </div>
        <p class="text-xl font-bold text-operacao-800">{{ filteredEntradas.length }}</p>
      </UCard>
      <UCard :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-guardian-400" />
          <span class="text-xs font-medium text-operacao-400">Total Quantidade</span>
        </div>
        <p class="text-xl font-bold text-operacao-800">{{ formatNumber(totalQuantidade) }}</p>
      </UCard>
      <UCard :ui="{ ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm', body: { padding: 'px-5 py-4' } }">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span class="text-xs font-medium text-operacao-400">Valor Total</span>
        </div>
        <p class="text-xl font-bold text-operacao-800">{{ formatCurrency(totalValor) }}</p>
      </UCard>
    </div>

    <!-- Tabela -->
    <UCard :ui="{ base: 'overflow-hidden', body: { padding: '' }, ring: 'ring-1 ring-[#EBEBED]', shadow: 'shadow-sm' }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          divide: 'divide-y divide-operacao-50 dark:divide-operacao-700',
          thead: '',
          th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
          td: { color: 'text-operacao-600 dark:text-operacao-200', size: 'text-sm', padding: 'px-4 py-2.5' }
        }"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #data-data="{ row }">
          {{ formatDate(row.data) }}
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

        <template #custo_unitario-data="{ row }">
          {{ formatCurrency(row.custo_unitario) }}
        </template>

        <template #valor_total-data="{ row }">
          <span class="font-medium text-controle-600">{{ formatCurrency(row.valor_total) }}</span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2 justify-end">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-pencil-square"
              size="xs"
              @click="openModal(row)"
            />
            <UButton
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              @click="confirmDelete(row)"
            />
          </div>
        </template>
      </UTable>
      <TablePagination
        v-model="page"
        :page-size="pageSize"
        :total-items="filteredEntradas.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal de Nova Entrada (Multi-item) -->
    <UModal
      v-model="modalOpen"
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
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-5">
          <!-- Campos compartilhados -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <UFormGroup label="Data" required>
              <UInput v-model="formData" type="date" />
            </UFormGroup>
            <UFormGroup label="Número da NF">
              <UInput v-model="formNf" placeholder="Ex: 001234" />
            </UFormGroup>
          </div>

          <!-- Divider -->
          <div class="border-t border-operacao-200 dark:border-operacao-700" />

          <!-- Lista de itens -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-operacao-600">
                Itens da entrada
              </span>
              <UBadge color="green" variant="subtle" size="xs" v-if="itens.length > 0">
                {{ itens.length }} {{ itens.length === 1 ? 'item' : 'itens' }}
              </UBadge>
            </div>

            <!-- Item rows -->
            <div class="space-y-3">
              <div
                v-for="(item, index) in itens"
                :key="index"
                class="relative group rounded-xl border border-operacao-200 dark:border-operacao-700 bg-operacao-50/50 dark:bg-operacao-900/30 p-4 transition-all hover:border-controle-300 hover:shadow-sm"
              >
                <!-- Botão remover (só se multi-item e não editando) -->
                <button
                  v-if="itens.length > 1 && !editingEntrada"
                  @click="removeItem(index)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>

                <!-- Linha 1: Produto -->
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
                    @change="onProdutoChange(index)"
                  >
                    <template #leading>
                      <UIcon name="i-heroicons-cube" class="w-4 h-4 text-operacao-400" />
                    </template>
                    <template #label>
                      <span v-if="item.produto_id" class="truncate">
                        {{ getProdutoNome(item.produto_id) }}
                      </span>
                      <span v-else class="text-operacao-400">Buscar produto...</span>
                    </template>
                  </USelectMenu>
                </div>

                <!-- Linha 2: Quantidade + UN | Valor Total | Custo Unitário -->
                <div class="grid grid-cols-3 gap-3">
                  <!-- Quantidade com UN -->
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

                  <!-- Valor Total -->
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Valor Total (R$)</label>
                    <CurrencyInput
                      v-model="item.valor_total"
                      placeholder="0,00"
                      size="md"
                    />
                  </div>

                  <!-- Custo Unitário (calculado) -->
                  <div>
                    <label class="block text-xs font-medium text-operacao-400 mb-1">Custo Unit.</label>
                    <div class="h-[38px] flex items-center px-3 bg-controle-50 dark:bg-controle-900/20 border border-controle-200 dark:border-controle-800 rounded-md">
                      <span class="text-sm font-semibold text-controle-700 dark:text-controle-400">
                        {{ formatCurrency(calcCustoUnitario(item)) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Observação (colapsável) -->
                <div class="mt-3" v-if="item.showObs">
                  <UTextarea
                    v-model="item.observacao"
                    placeholder="Observações deste item..."
                    :rows="2"
                    size="sm"
                  />
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

            <!-- Botão adicionar item (só no modo criação) -->
            <button
              v-if="!editingEntrada"
              @click="addItem"
              class="w-full py-3 border-2 border-dashed border-operacao-300 dark:border-operacao-600 rounded-xl text-sm text-operacao-400 hover:border-controle-400 hover:text-controle-600 hover:bg-controle-50/50 transition-all flex items-center justify-center gap-2"
            >
              <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
              Adicionar outro produto
            </button>
          </div>

          <!-- Resumo do total (quando multi-item) -->
          <div
            v-if="itens.length > 1"
            class="flex items-center justify-between p-3 bg-controle-50 dark:bg-controle-900/20 rounded-lg border border-controle-200 dark:border-controle-800"
          >
            <span class="text-sm font-medium text-operacao-600 dark:text-operacao-300">Total da entrada</span>
            <span class="text-lg font-bold text-controle-700 dark:text-controle-400">
              {{ formatCurrency(totalItens) }}
            </span>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveEntrada">
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              {{ editingEntrada ? 'Salvar Alterações' : `Registrar ${itens.length > 1 ? itens.length + ' Entradas' : 'Entrada'}` }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Confirmação de Exclusão -->
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

        <p>Tem certeza que deseja excluir esta entrada?</p>
        <div class="mt-2 p-3 bg-operacao-50 rounded-lg">
          <p><strong>Produto:</strong> {{ deletingEntrada?.produto?.nome }}</p>
          <p><strong>Data:</strong> {{ formatDate(deletingEntrada?.data) }}</p>
          <p><strong>Quantidade:</strong> {{ formatNumber(deletingEntrada?.quantidade) }}</p>
        </div>
        <p class="text-sm text-operacao-400 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteEntrada">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Slideover de Produções Pendentes -->
    <USlideover
      v-model="showPendentes"
      :ui="{
        width: 'max-w-md',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800'
      }"
    >
      <div class="flex flex-col h-full">
        <!-- Header -->
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
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="showPendentes = false"
          />
        </div>

        <!-- Lista -->
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
                <p class="text-xs text-operacao-400 mt-1.5">
                  Custo: {{ formatCurrency(benef.saida?.custo_saida) }}
                </p>
              </div>
              <UIcon
                name="i-heroicons-chevron-right"
                class="w-5 h-5 text-operacao-300 group-hover:text-purple-500 transition-colors flex-shrink-0 mt-1"
              />
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

    <!-- Slideover de Transferências Pendentes -->
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
              <UIcon
                name="i-heroicons-chevron-right"
                class="w-5 h-5 text-operacao-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1"
              />
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

    <!-- Modal de Resolução de Produção -->
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
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="resolucaoModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <!-- Info de custo -->
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

          <!-- Lista de produtos finais -->
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
                  <UInput
                    v-model.number="item.quantidade"
                    type="number"
                    step="0.0001"
                    min="0"
                    placeholder="0"
                    size="md"
                  />
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

          <!-- Resumo -->
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
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="resolucaoModalOpen = false">
              Cancelar
            </UButton>
            <UButton
              color="purple"
              class="w-full sm:w-auto"
              :loading="resolvendo"
              :disabled="itensResolucao.length === 0"
              @click="confirmarResolucao"
            >
              <UIcon name="i-heroicons-check" class="w-4 h-4 mr-1.5" />
              Confirmar Rendimento
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal: Transferência para Apoio -->
    <MovimentosTransferenciaApoioModal
      v-model="transferenciaApoioOpen"
      :itens-entrada="itensParaApoio"
    />
  </div>
</template>

<script setup lang="ts">
import type { Entrada, Produto, Beneficiamento, TransferenciaPendente } from '~/types'

const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

interface ItemEntrada {
  produto_id: string
  quantidade: number
  valor_total: number
  observacao: string
  showObs: boolean
}

const {
  getEntradas,
  createEntrada,
  updateEntrada,
  deleteEntrada: removeEntrada,
  getProdutos,
  getBeneficiamentosPendentes,
  countBeneficiamentosPendentes,
  resolverBeneficiamento,
  getProdutosBeneficiamento,
  getTransferenciasPendentes,
  countTransferenciasPendentes
} = useEstoque()
const { empresaId, empresaAtiva } = useEmpresa()
const toast = useToast()

const entradas = ref<Entrada[]>([])
const produtos = ref<Produto[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filtroDataInicio = ref('')
const filtroDataFim = ref('')
const modalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingEntrada = ref<Entrada | null>(null)
const deletingEntrada = ref<Entrada | null>(null)

// Transferência para Apoio
const transferenciaApoioOpen = ref(false)
const itensParaApoio = ref<Array<{ produto_id: string; quantidade: number; produto_nome: string; unidade_sigla: string }>>([])

watch(transferenciaApoioOpen, (aberto) => {
  if (!aberto) itensParaApoio.value = []
})

// Beneficiamento
const showPendentes = ref(false)
const pendentes = ref<Beneficiamento[]>([])
const pendentesCount = ref(0)
const resolucaoModalOpen = ref(false)

// Transferências pendentes
const showPendentesTransf = ref(false)
const pendentesTransf = ref<TransferenciaPendente[]>([])
const pendentesTransfCount = ref(0)
const transfRecebimentoModalOpen = ref(false)
const transfSelecionada = ref<TransferenciaPendente | null>(null)
const resolvingBeneficiamento = ref<Beneficiamento | null>(null)
const itensResolucao = ref<Array<{
  produto_final_id: string
  produto_nome: string
  unidade_sigla: string
  quantidade: number
  gramatura: number
}>>([])
const resolvendo = ref(false)

// Campos compartilhados do modal
const formData = ref(new Date().toISOString().split('T')[0])
const formNf = ref('')

// Lista de itens da entrada
const itens = ref<ItemEntrada[]>([])

const columns = [
  { key: 'data', label: 'Data', sortable: true },
  { key: 'produto', label: 'Produto', sortable: true },
  { key: 'semana', label: 'Semana' },
  { key: 'quantidade', label: 'Quantidade' },
  { key: 'custo_unitario', label: 'Custo Unit.' },
  { key: 'valor_total', label: 'Valor Total' },
  { key: 'numero_nf', label: 'NF' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

// Opções de produtos para o select
const produtosSelect = computed(() =>
  produtos.value.map(p => ({
    label: `${p.nome} ${p.unidade?.sigla ? `(${p.unidade.sigla})` : ''}`,
    value: p.id
  }))
)

const filteredEntradas = computed(() => {
  let result = entradas.value

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(e =>
      e.produto?.nome?.toLowerCase().includes(term) ||
      e.produto?.categoria?.nome?.toLowerCase().includes(term)
    )
  }

  return result
})

const clearFilters = () => {
  search.value = ''
  filtroDataInicio.value = ''
  filtroDataFim.value = ''
  loadEntradas()
}

const { page, pageSize, paginatedItems } = usePagination(filteredEntradas)

const totalQuantidade = computed(() =>
  filteredEntradas.value.reduce((sum, e) => sum + Number(e.quantidade), 0)
)

const totalValor = computed(() =>
  filteredEntradas.value.reduce((sum, e) => sum + Number(e.valor_total), 0)
)

// Total dos itens no modal
const totalItens = computed(() =>
  itens.value.reduce((sum, item) => sum + (Number(item.valor_total) || 0), 0)
)

// Helpers de produto
const getProdutoNome = (produtoId: string) => {
  const p = produtos.value.find(p => p.id === produtoId)
  return p ? p.nome : ''
}

const getProdutoUnidade = (produtoId: string) => {
  const p = produtos.value.find(p => p.id === produtoId)
  return p?.unidade?.sigla || ''
}

const onProdutoChange = (_index: number) => {
  // Hook para futuras ações ao mudar produto
}

const calcCustoUnitario = (item: ItemEntrada) => {
  if (!item.quantidade || item.quantidade === 0) return 0
  return (item.valor_total || 0) / item.quantidade
}

const createEmptyItem = (): ItemEntrada => ({
  produto_id: '',
  quantidade: 0,
  valor_total: 0,
  observacao: '',
  showObs: false
})

const addItem = () => {
  itens.value.push(createEmptyItem())
}

const removeItem = (index: number) => {
  itens.value.splice(index, 1)
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

const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

const { formatCurrency, formatNumber } = useFormatters()

const loadEntradas = async () => {
  try {
    loading.value = true
    entradas.value = await getEntradas({
      dataInicio: filtroDataInicio.value || undefined,
      dataFim: filtroDataFim.value || undefined
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar entradas',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const loadProdutos = async () => {
  try {
    produtos.value = await getProdutos()
  } catch (error) {
  }
}

const openModal = (entrada?: Entrada) => {
  if (entrada) {
    editingEntrada.value = entrada
    formData.value = entrada.data
    formNf.value = entrada.numero_nf || ''
    itens.value = [{
      produto_id: entrada.produto_id,
      quantidade: entrada.quantidade,
      valor_total: entrada.valor_total,
      observacao: entrada.observacao || '',
      showObs: !!entrada.observacao
    }]
  } else {
    editingEntrada.value = null
    formData.value = new Date().toISOString().split('T')[0]
    formNf.value = ''
    itens.value = [createEmptyItem()]
  }
  modalOpen.value = true
}

const saveEntrada = async () => {
  // Validar itens
  const itensValidos = itens.value.filter(item => item.produto_id)

  if (itensValidos.length === 0) {
    toast.add({
      title: 'Atenção',
      description: 'Selecione pelo menos um produto',
      color: 'amber'
    })
    return
  }

  for (const item of itensValidos) {
    if (!item.quantidade || item.quantidade <= 0) {
      const nome = getProdutoNome(item.produto_id)
      toast.add({
        title: 'Atenção',
        description: `Informe a quantidade para "${nome}"`,
        color: 'amber'
      })
      return
    }
    if (!item.valor_total || item.valor_total <= 0) {
      const nome = getProdutoNome(item.produto_id)
      toast.add({
        title: 'Atenção',
        description: `Informe o valor total para "${nome}"`,
        color: 'amber'
      })
      return
    }
  }

  if (!formData.value) {
    toast.add({
      title: 'Atenção',
      description: 'Informe a data da entrada',
      color: 'amber'
    })
    return
  }

  try {
    saving.value = true

    if (editingEntrada.value) {
      // Edição: salva apenas o primeiro item
      const item = itensValidos[0]
      await updateEntrada(editingEntrada.value.id, {
        produto_id: item.produto_id,
        data: formData.value,
        quantidade: item.quantidade,
        custo_unitario: calcCustoUnitario(item),
        valor_total: item.valor_total,
        numero_nf: formNf.value || undefined,
        observacao: item.observacao || undefined
      })
      toast.add({
        title: 'Sucesso',
        description: 'Entrada atualizada com sucesso',
        color: 'green'
      })
    } else {
      // Criação: salva todos os itens
      for (const item of itensValidos) {
        await createEntrada({
          produto_id: item.produto_id,
          data: formData.value,
          quantidade: item.quantidade,
          custo_unitario: calcCustoUnitario(item),
          valor_total: item.valor_total,
          numero_nf: formNf.value || undefined,
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
      console.log('[Apoio] empresaAtiva:', empresaAtiva.value?.sugerir_transferencia_apoio, 'itensValidos:', itensValidos.length)
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
        console.log('[Apoio] itensParaApoio preparados:', itensParaApoio.value.length)
      }
    }

    modalOpen.value = false
    await loadEntradas()
    page.value = 1

    // Abrir modal de apoio após o modal de entrada terminar de fechar
    console.log('[Apoio] Verificando abertura do modal:', itensParaApoio.value.length)
    if (itensParaApoio.value.length > 0) {
      console.log('[Apoio] Abrindo modal em 300ms...')
      setTimeout(() => {
        console.log('[Apoio] setTimeout disparou, transferenciaApoioOpen = true')
        transferenciaApoioOpen.value = true
      }, 300)
    }
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar entrada',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (entrada: Entrada) => {
  deletingEntrada.value = entrada
  deleteModalOpen.value = true
}

const deleteEntrada = async () => {
  if (!deletingEntrada.value) return

  try {
    deleting.value = true
    await removeEntrada(deletingEntrada.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Entrada excluída com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadEntradas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir entrada',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

// ==========================================
// Beneficiamento - Resolução
// ==========================================

const eficienciaProdutoOrigem = computed(() => {
  return resolvingBeneficiamento.value?.saida?.produto?.eficiencia_beneficiamento || null
})

const custoRealSaida = computed(() => {
  const custoOriginal = Number(resolvingBeneficiamento.value?.saida?.custo_saida) || 0
  const eficiencia = eficienciaProdutoOrigem.value
  if (!eficiencia || eficiencia >= 100) return custoOriginal
  return custoOriginal / (eficiencia / 100)
})

// Custo por kg = custoReal / quantidade original da saída (kg)
const custoPorKg = computed(() => {
  const qtdSaida = Number(resolvingBeneficiamento.value?.saida?.quantidade) || 0
  if (qtdSaida <= 0) return 0
  return custoRealSaida.value / qtdSaida
})

const resumoResolucao = computed(() => {
  const qtdTotal = itensResolucao.value.reduce((sum, i) => sum + (i.quantidade || 0), 0)
  const pesoTotal = itensResolucao.value.reduce((sum, i) => sum + ((i.gramatura || 0) * (i.quantidade || 0)), 0)
  const valorTotal = itensResolucao.value.reduce((sum, i, idx) => {
    return sum + (calcCustoUnitarioResolucao(idx) * (i.quantidade || 0))
  }, 0)
  return { qtdTotal, pesoTotal, valorTotal }
})

// Custo unitário = custo por kg * gramatura da unidade
const calcCustoUnitarioResolucao = (index: number) => {
  const item = itensResolucao.value[index]
  if (!item || !item.gramatura) return 0
  return custoPorKg.value * item.gramatura
}

const loadPendentes = async () => {
  try {
    pendentesCount.value = await countBeneficiamentosPendentes()
    if (pendentesCount.value > 0) {
      pendentes.value = await getBeneficiamentosPendentes()
    } else {
      pendentes.value = []
    }
  } catch (error) {
  }
}

// Transferências pendentes
const loadPendentesTransf = async () => {
  try {
    pendentesTransfCount.value = await countTransferenciasPendentes()
    if (pendentesTransfCount.value > 0) {
      pendentesTransf.value = await getTransferenciasPendentes()
    } else {
      pendentesTransf.value = []
    }
  } catch (error) {
  }
}

const openTransfRecebimento = (transf: TransferenciaPendente) => {
  showPendentesTransf.value = false
  setTimeout(() => {
    transfSelecionada.value = transf
    transfRecebimentoModalOpen.value = true
  }, 300)
}

const onTransfResolvida = () => {
  loadPendentesTransf()
  loadEntradas()
}

const openResolucaoFromSlideover = (benef: Beneficiamento) => {
  showPendentes.value = false
  // Aguarda transição do slideover fechar antes de abrir o modal
  setTimeout(() => {
    openResolucao(benef)
  }, 300)
}

const openResolucao = async (benef: Beneficiamento) => {
  resolvingBeneficiamento.value = benef

  // Buscar produtos finais vinculados ao produto de origem
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
    itensResolucao.value = []
  }

  resolucaoModalOpen.value = true
}

const confirmarResolucao = async () => {
  if (!resolvingBeneficiamento.value) return

  const itensValidos = itensResolucao.value.filter(i => i.quantidade > 0)
  if (itensValidos.length === 0) {
    toast.add({
      title: 'Atenção',
      description: 'Informe a quantidade de pelo menos um produto final',
      color: 'amber'
    })
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
    toast.add({
      title: 'Sucesso',
      description: 'Produção resolvida! Entradas dos produtos finais criadas com sucesso.',
      color: 'green'
    })
    resolucaoModalOpen.value = false
    await loadPendentes()
    await loadEntradas()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao resolver produção',
      color: 'red'
    })
  } finally {
    resolvendo.value = false
  }
}

watch([filtroDataInicio, filtroDataFim], () => {
  loadEntradas()
})

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['entradas', 'beneficiamentos', 'beneficiamento_itens'], () => {
  loadEntradas()
  loadPendentes()
  loadPendentesTransf()
})
onTableChange('produtos', () => loadProdutos())

watch(empresaId, () => {
  if (empresaId.value) {
    loadEntradas()
    loadProdutos()
    loadPendentes()
    loadPendentesTransf()
  }
}, { immediate: true })
</script>
