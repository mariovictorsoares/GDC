<template>
  <div class="space-y-6">
    <!-- Header -->
    <h1 class="text-2xl font-semibold text-[#5a5a66] mb-2">Produtos</h1>

    <!-- Toolbar: Filtros + Ações -->
    <div class="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
      <!-- Filtros (esquerda) -->
      <div class="flex flex-col sm:flex-row flex-wrap gap-3 flex-1 min-w-0">
        <UInput
          v-model="search"
          placeholder="Buscar..."
          icon="i-heroicons-magnifying-glass"
          class="w-full sm:w-44"
          :ui="toolbarInputUi"
        />
        <!-- Filtro Grupo/Subgrupo expansível -->
        <UPopover v-model:open="categoriaPopoverOpen" :popper="{ placement: 'bottom-start' }">
          <UButton
            color="white"
            class="w-full sm:w-52 justify-between"
            trailing-icon="i-heroicons-chevron-down-20-solid"
            :ui="toolbarButtonUi"
          >
            <span class="truncate text-left font-normal"><span class="text-operacao-400">Grupo:</span> <span class="text-gray-900">{{ filterCategoriaLabel }}</span></span>
          </UButton>

          <template #panel>
            <div class="w-64 max-h-72 overflow-y-auto py-1">
              <!-- Todos -->
              <button
                class="w-full text-left px-3 py-1.5 text-sm rounded transition-colors"
                :class="!filterCategoria ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-600 hover:bg-operacao-50'"
                @click="selectCategoria('')"
              >
                Todos
              </button>

              <!-- Grupos expansíveis -->
              <div v-for="grupo in grupos" :key="grupo.id">
                <div class="flex items-center">
                  <button
                    class="p-1 rounded hover:bg-operacao-100 transition-colors"
                    @click.stop="toggleGrupoExpand(grupo.id)"
                  >
                    <UIcon
                      :name="expandedGrupos.has(grupo.id) ? 'i-heroicons-chevron-down-20-solid' : 'i-heroicons-chevron-right-20-solid'"
                      class="w-3.5 h-3.5 text-operacao-400"
                    />
                  </button>
                  <button
                    class="flex-1 text-left px-2 py-1.5 text-sm rounded transition-colors"
                    :class="filterCategoria === `g:${grupo.id}` ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-700 hover:bg-operacao-50'"
                    @click="selectCategoria(`g:${grupo.id}`)"
                  >
                    {{ grupo.nome }}
                  </button>
                </div>

                <!-- Subgrupos -->
                <div v-if="expandedGrupos.has(grupo.id)" class="ml-2">
                  <button
                    v-for="sub in subgruposDe(grupo.id)"
                    :key="sub.id"
                    class="w-full text-left pl-7 pr-3 py-1.5 text-sm rounded transition-colors"
                    :class="filterCategoria === `s:${sub.id}` ? 'text-guardian-600 font-medium bg-guardian-50' : 'text-operacao-500 hover:bg-operacao-50'"
                    @click="selectCategoria(`s:${sub.id}`)"
                  >
                    {{ sub.nome }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </UPopover>
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
          placeholder="Status"
          class="w-full sm:w-32"
          :ui="toolbarInputUi"
        />
      </div>

      <!-- Ações (direita) -->
      <div class="flex gap-2 flex-shrink-0">
        <UButton color="white" :ui="toolbarButtonUi" @click="openGruposModal()">
          <UIcon name="i-heroicons-folder" class="w-4 h-4 mr-1.5" />
          Grupos
        </UButton>
        <UButton color="white" :ui="toolbarButtonUi" @click="openUnidadesModal()">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-1.5" />
          Unidades
        </UButton>
        <UButton color="primary" @click="openModal()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1.5" />
          Novo Produto
        </UButton>
      </div>
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

        <template #nome-data="{ row }">
          <span class="font-semibold text-operacao-800 dark:text-white">{{ row.nome }}</span>
        </template>

        <template #subgrupo-data="{ row }">
          <span class="whitespace-nowrap">
            <span class="text-operacao-400">{{ row.subgrupo?.grupo?.nome }}</span>
            <span v-if="row.subgrupo?.grupo?.nome && row.subgrupo?.nome" class="text-operacao-300 mx-1">›</span>
            <span>{{ row.subgrupo?.nome || '-' }}</span>
          </span>
        </template>

        <template #unidade-data="{ row }">
          {{ row.unidade?.sigla || '-' }}
        </template>

        <template #estoque_inicial-data="{ row }">
          {{ formatNumber(row.estoque_inicial) }}
        </template>

        <template #preco_inicial-data="{ row }">
          {{ formatCurrency(row.preco_inicial) }}
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
        :total-items="filteredProdutos.length"
        @update:page-size="pageSize = $event"
      />
    </UCard>

    <!-- Modal de Cadastro/Edição -->
    <UModal
      v-model="modalOpen"
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
            <h3 class="text-lg font-semibold">
              {{ editingProduto ? 'Editar Produto' : 'Novo Produto' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="modalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveProduto" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormGroup label="Nome" required class="md:col-span-2">
              <UInput v-model="form.nome" placeholder="Nome do produto" />
              <!-- Alerta de produtos similares -->
              <div v-if="!editingProduto && produtosSimilares.length > 0" class="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div class="flex items-start gap-2">
                  <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div class="text-sm">
                    <p class="font-medium text-amber-700">Produtos similares encontrados:</p>
                    <ul class="mt-1 space-y-0.5">
                      <li v-for="similar in produtosSimilares" :key="similar.id" class="text-amber-600">
                        <span class="font-medium">{{ similar.nome }}</span>
                        <span class="text-amber-400 text-xs ml-1">({{ similar.subgrupo?.nome || 'sem subgrupo' }})</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </UFormGroup>

            <UFormGroup label="Grupo" required>
              <USelect
                v-model="form.grupo_id"
                :options="gruposSelect"
                placeholder="Selecione o grupo"
                :disabled="!!editingProduto"
                :ui="editingProduto ? { color: { white: { outline: 'bg-operacao-100 text-operacao-400 cursor-not-allowed' } } } : {}"
                @change="form.subgrupo_id = ''"
              />
            </UFormGroup>

            <UFormGroup label="Subgrupo" required>
              <USelect
                v-model="form.subgrupo_id"
                :options="subgruposSelectFiltered"
                placeholder="Selecione o subgrupo"
                :disabled="!!editingProduto || !form.grupo_id"
                :ui="editingProduto || !form.grupo_id ? { color: { white: { outline: 'bg-operacao-100 text-operacao-400 cursor-not-allowed' } } } : {}"
              />
            </UFormGroup>

            <UFormGroup label="Unidade" required>
              <div class="flex gap-2">
                <USelect
                  v-model="form.unidade_id"
                  :options="unidadesSelect"
                  placeholder="Selecione a unidade"
                  class="flex-1"
                  :disabled="!!editingProduto"
                  :ui="editingProduto ? { color: { white: { outline: 'bg-operacao-100 text-operacao-400 cursor-not-allowed' } } } : {}"
                />
                <UButton
                  v-if="!editingProduto"
                  color="gray"
                  variant="soft"
                  icon="i-heroicons-cog-6-tooth"
                  @click="openUnidadesModal()"
                  title="Gerenciar Unidades"
                />
              </div>
            </UFormGroup>

            <UFormGroup label="Status">
              <div class="flex items-center gap-2">
                <UToggle v-model="form.ativo" />
                <span class="text-sm text-operacao-500">{{ form.ativo ? 'Ativo' : 'Inativo' }}</span>
              </div>
            </UFormGroup>

          </div>

        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="modalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="saving" @click="saveProduto">
              {{ editingProduto ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Modal de Custos Mensais -->
    <UModal
      v-model="custosModalOpen"
      :ui="{
        width: 'sm:max-w-4xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Custos Mensais</h3>
              <p class="text-sm text-operacao-400">{{ selectedProduto?.nome }}</p>
            </div>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="custosModalOpen = false"
            />
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex gap-4 items-center">
            <UFormGroup label="Ano">
              <USelect
                v-model="custoAno"
                :options="anosOptions"
                class="w-32"
              />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <UFormGroup
              v-for="mes in 12"
              :key="mes"
              :label="mesesNomes[mes - 1]"
            >
              <CurrencyInput
                v-model="custosForm[mes]"
                placeholder="0,00"
                @blur="saveCustoMensal(mes)"
              />
            </UFormGroup>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" class="w-full sm:w-auto" @click="custosModalOpen = false">
              Fechar
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

        <p>Tem certeza que deseja desativar o produto <strong>{{ deletingProduto?.nome }}</strong>?</p>
        <p class="text-sm text-operacao-400 mt-2">O produto será marcado como inativo.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deleting" @click="deleteProduto">
              Desativar
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Slideover de Gerenciamento de Unidades -->
    <USlideover
      v-model="unidadesModalOpen"
      :prevent-close="deleteUnidadeModalOpen || unidadeEditModalOpen"
      :ui="{
        width: 'max-w-2xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
      @after-leave="onUnidadesModalClose"
    >
      <div :inert="deleteUnidadeModalOpen || unidadeEditModalOpen || undefined" class="h-full">
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700', base: 'flex flex-col h-full', body: { base: 'flex-1 overflow-y-auto min-h-0' } }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Gerenciar Unidades</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="unidadesModalOpen = false"
            />
          </div>
        </template>

        <!-- Botão Nova Unidade -->
        <div class="mb-4">
          <UButton color="primary" size="sm" @click="openUnidadeEditModal()">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            Nova Unidade
          </UButton>
        </div>

        <!-- Lista de Unidades -->
        <div class="overflow-y-auto border rounded-lg">
          <UTable
            :columns="unidadesColumns"
            :rows="unidades"
            :ui="{
              td: { color: 'text-operacao-600 dark:text-operacao-200' },
              th: { base: 'bg-operacao-100/70 dark:bg-operacao-800 border-b border-operacao-200/60 [&_button]:font-medium [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-xs [&_button]:text-[#5a5a66] [&_button>span+span]:text-operacao-300 [&_button>span+span]:!w-3.5 [&_button>span+span]:!h-3.5', color: 'text-[#5a5a66] dark:text-operacao-400', font: 'font-medium', size: 'text-xs uppercase tracking-wider', padding: 'px-4 py-2' },
              thead: 'sticky top-0 z-10'
            }"
          >
            <template #empty-state>
              <div class="flex flex-col items-center justify-center py-6 text-operacao-400">
                <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
                <p class="text-sm">Nenhuma unidade cadastrada</p>
              </div>
            </template>

            <template #sigla-data="{ row }">
              <span class="font-semibold text-operacao-800 dark:text-white">{{ row.sigla }}</span>
            </template>

            <template #descricao-data="{ row }">
              <span class="text-operacao-500">{{ row.descricao || '—' }}</span>
            </template>

            <template #actions-data="{ row }">
              <div class="flex gap-1 justify-end">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="xs"
                  @click="openUnidadeEditModal(row)"
                />
                <UButton
                  color="red"
                  variant="ghost"
                  icon="i-heroicons-trash"
                  size="xs"
                  @click="confirmDeleteUnidade(row)"
                />
              </div>
            </template>
          </UTable>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" @click="unidadesModalOpen = false">
              Fechar
            </UButton>
          </div>
        </template>
      </UCard>
      </div>
    </USlideover>

    <!-- Modal de Confirmação de Exclusão de Unidade -->
    <UModal
      v-model="deleteUnidadeModalOpen"
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

        <p>Tem certeza que deseja excluir a unidade <strong>{{ deletingUnidade?.sigla }}</strong>?</p>
        <p class="text-sm text-operacao-400 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteUnidadeModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletingUnidadeLoading" @click="deleteUnidade">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Sub-Modal: Criar/Editar Unidade -->
    <UModal
      v-model="unidadeEditModalOpen"
      :ui="{
        width: 'sm:max-w-md',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingUnidade ? 'Editar Unidade' : 'Nova Unidade' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="unidadeEditModalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveUnidade" class="space-y-4">
          <UFormGroup label="Sigla" required>
            <UInput v-model="unidadeForm.sigla" placeholder="Ex: KG" maxlength="10" autofocus />
          </UFormGroup>
          <UFormGroup label="Descrição">
            <UInput v-model="unidadeForm.descricao" placeholder="Ex: Quilograma" />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="unidadeEditModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="savingUnidade" @click="saveUnidade">
              {{ editingUnidade ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Slideover de Gerenciamento de Grupos e Subgrupos -->
    <USlideover
      v-model="gruposModalOpen"
      :prevent-close="grupoEditModalOpen || subgrupoEditModalOpen || deleteGrupoModalOpen || deleteSubgrupoModalOpen"
      :ui="{
        width: 'max-w-2xl',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
      @after-leave="onGruposModalClose"
    >
      <div :inert="anyGrupoSubModalOpen || undefined" class="h-full">
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700', base: 'flex flex-col h-full', body: { base: 'flex-1 overflow-y-auto min-h-0' } }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Gerenciar Grupos e Subgrupos</h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="gruposModalOpen = false"
            />
          </div>
        </template>

        <!-- Botão Novo Grupo -->
        <div class="mb-4">
          <UButton color="primary" size="sm" @click="openGrupoEditModal()">
            <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
            Novo Grupo
          </UButton>
        </div>

        <!-- Tabela estilo planilha -->
        <div class="overflow-x-auto border rounded-lg">
          <table class="w-full">
            <thead class="sticky top-0 z-10">
              <tr class="border-b border-operacao-200/60">
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#5a5a66] dark:text-operacao-400 bg-operacao-100/70 dark:bg-operacao-800 w-48">Grupo</th>
                <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#5a5a66] dark:text-operacao-400 bg-operacao-100/70 dark:bg-operacao-800">Subgrupo</th>
                <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#5a5a66] dark:text-operacao-400 bg-operacao-100/70 dark:bg-operacao-800 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(grupo, grupoIndex) in gruposData" :key="grupo.id">
                <tr
                  class="border-b border-operacao-100"
                  :class="grupoIndex % 2 === 0 ? 'bg-white' : 'bg-operacao-50'"
                >
                  <td
                    class="px-4 py-2 font-semibold text-operacao-800 align-top border-r border-operacao-200"
                    :class="grupoIndex % 2 === 0 ? 'bg-white' : 'bg-operacao-50'"
                    :rowspan="Math.max(getSubgruposDoGrupo(grupo.id).length, 1)"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ grupo.nome }}</span>
                      <div class="flex gap-1">
                        <UButton
                          color="gray"
                          variant="ghost"
                          icon="i-heroicons-plus"
                          size="xs"
                          title="Adicionar subgrupo"
                          @click="openSubgrupoEditModal(undefined, grupo.id)"
                        />
                        <UButton
                          color="gray"
                          variant="ghost"
                          icon="i-heroicons-pencil-square"
                          size="xs"
                          @click="openGrupoEditModal(grupo)"
                        />
                        <UButton
                          color="red"
                          variant="ghost"
                          icon="i-heroicons-trash"
                          size="xs"
                          @click="confirmDeleteGrupoItem(grupo)"
                        />
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-operacao-600">
                    <template v-if="getSubgruposDoGrupo(grupo.id).length > 0">
                      {{ getSubgruposDoGrupo(grupo.id)[0].nome }}
                    </template>
                    <template v-else>
                      <span class="text-operacao-400 italic text-sm">Nenhum subgrupo</span>
                    </template>
                  </td>
                  <td class="px-4 py-2 text-right">
                    <template v-if="getSubgruposDoGrupo(grupo.id).length > 0">
                      <div class="flex gap-1 justify-end">
                        <UButton
                          color="gray"
                          variant="ghost"
                          icon="i-heroicons-pencil-square"
                          size="xs"
                          @click="openSubgrupoEditModal(getSubgruposDoGrupo(grupo.id)[0])"
                        />
                        <UButton
                          color="red"
                          variant="ghost"
                          icon="i-heroicons-trash"
                          size="xs"
                          @click="confirmDeleteSubgrupoItem(getSubgruposDoGrupo(grupo.id)[0])"
                        />
                      </div>
                    </template>
                  </td>
                </tr>
                <tr
                  v-for="subgrupo in getSubgruposDoGrupo(grupo.id).slice(1)"
                  :key="subgrupo.id"
                  class="border-b border-operacao-100"
                  :class="grupoIndex % 2 === 0 ? 'bg-white' : 'bg-operacao-50'"
                >
                  <td class="px-4 py-2 text-operacao-600">{{ subgrupo.nome }}</td>
                  <td class="px-4 py-2 text-right">
                    <div class="flex gap-1 justify-end">
                      <UButton
                        color="gray"
                        variant="ghost"
                        icon="i-heroicons-pencil-square"
                        size="xs"
                        @click="openSubgrupoEditModal(subgrupo)"
                      />
                      <UButton
                        color="red"
                        variant="ghost"
                        icon="i-heroicons-trash"
                        size="xs"
                        @click="confirmDeleteSubgrupoItem(subgrupo)"
                      />
                    </div>
                  </td>
                </tr>
              </template>
              <tr v-if="gruposData.length === 0 && !loadingGrupos">
                <td colspan="3" class="px-4 py-12 text-center text-operacao-400">
                  <UIcon name="i-heroicons-folder-open" class="w-12 h-12 mx-auto mb-4" />
                  <p class="text-lg font-medium">Nenhum grupo cadastrado</p>
                  <p class="text-sm mt-1">Comece criando um novo grupo</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Loading -->
          <div v-if="loadingGrupos" class="flex items-center justify-center py-8 text-operacao-400">
            <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin mr-2" />
            <span class="text-sm">Carregando...</span>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="gray" @click="gruposModalOpen = false">
              Fechar
            </UButton>
          </div>
        </template>
      </UCard>
      </div>
    </USlideover>

    <!-- Sub-Modal: Criar/Editar Grupo -->
    <UModal
      v-model="grupoEditModalOpen"
      :ui="{
        width: 'sm:max-w-md',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingGrupoItem ? 'Editar Grupo' : 'Novo Grupo' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="grupoEditModalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveGrupoItem" class="space-y-4">
          <UFormGroup label="Nome do Grupo" required>
            <UInput v-model="grupoEditForm.nome" placeholder="Ex: Alimentos" autofocus />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="grupoEditModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="savingGrupoItem" @click="saveGrupoItem">
              {{ editingGrupoItem ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Sub-Modal: Criar/Editar Subgrupo -->
    <UModal
      v-model="subgrupoEditModalOpen"
      :ui="{
        width: 'sm:max-w-md',
        overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-operacao-800',
        ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ editingSubgrupoItem ? 'Editar Subgrupo' : 'Novo Subgrupo' }}
            </h3>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-x-mark"
              @click="subgrupoEditModalOpen = false"
            />
          </div>
        </template>

        <form @submit.prevent="saveSubgrupoItem" class="space-y-4">
          <UFormGroup label="Grupo" required>
            <USelect
              v-model="subgrupoEditForm.grupo_id"
              :options="gruposSelectForSubgrupo"
              placeholder="Selecione o grupo"
              :disabled="!!editingSubgrupoItem || !!preSelectedGrupoIdForEdit"
              :ui="(editingSubgrupoItem || preSelectedGrupoIdForEdit) ? { color: { white: { outline: 'bg-operacao-100 text-operacao-400 cursor-not-allowed' } } } : {}"
            />
          </UFormGroup>

          <UFormGroup label="Nome do Subgrupo" required>
            <UInput v-model="subgrupoEditForm.nome" placeholder="Ex: Mercearia" autofocus />
          </UFormGroup>
        </form>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="subgrupoEditModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="primary" class="w-full sm:w-auto" :loading="savingSubgrupoItem" @click="saveSubgrupoItem">
              {{ editingSubgrupoItem ? 'Salvar' : 'Criar' }}
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Sub-Modal: Confirmação Exclusão Grupo -->
    <UModal
      v-model="deleteGrupoModalOpen"
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

        <p>Tem certeza que deseja excluir o grupo <strong>{{ deletingGrupoItem?.nome }}</strong>?</p>
        <p class="text-sm text-operacao-400 mt-2">Todos os subgrupos vinculados também serão excluídos.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteGrupoModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletingGrupoItemLoading" @click="deleteGrupoItem">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- Sub-Modal: Confirmação Exclusão Subgrupo -->
    <UModal
      v-model="deleteSubgrupoModalOpen"
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

        <p>Tem certeza que deseja excluir o subgrupo <strong>{{ deletingSubgrupoItem?.nome }}</strong>?</p>
        <p class="text-sm text-operacao-400 mt-2">Esta ação não pode ser desfeita.</p>

        <template #footer>
          <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="deleteSubgrupoModalOpen = false">
              Cancelar
            </UButton>
            <UButton color="red" class="w-full sm:w-auto" :loading="deletingSubgrupoItemLoading" @click="deleteSubgrupoItem">
              Excluir
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { Produto, Grupo, Subgrupo, Unidade } from '~/types'

// UI consistente para toolbar (bordas iguais à tabela)
const toolbarInputUi = { color: { white: { outline: 'shadow-sm bg-white text-gray-900 ring-1 ring-inset ring-[#EBEBED] focus:ring-1 focus:ring-operacao-200 dark:ring-operacao-700' } } }
const toolbarButtonUi = { color: { white: { solid: 'shadow-sm ring-1 ring-inset ring-[#EBEBED] text-gray-700 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-guardian-500 dark:ring-operacao-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800/50' } } }

const {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto: removeProduto,
  getGrupos,
  getSubgrupos,
  getUnidades,
  createUnidade,
  updateUnidade,
  deleteUnidade: removeUnidade,
  getCustosMensais,
  upsertCustoMensal,
  createGrupo,
  updateGrupo,
  deleteGrupo: removeGrupo,
  createSubgrupo,
  updateSubgrupo,
  deleteSubgrupo: removeSubgrupo
} = useEstoque()
const { empresaId } = useEmpresa()
const toast = useToast()

const produtos = ref<Produto[]>([])
const grupos = ref<Grupo[]>([])
const subgrupos = ref<Subgrupo[]>([])
const unidades = ref<Unidade[]>([])
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const search = ref('')
const filterCategoria = ref('')
const filterStatus = ref('true')
const categoriaPopoverOpen = ref(false)
const expandedGrupos = ref<Set<string>>(new Set())
const modalOpen = ref(false)
const custosModalOpen = ref(false)
const deleteModalOpen = ref(false)
const editingProduto = ref<Produto | null>(null)
const selectedProduto = ref<Produto | null>(null)
const deletingProduto = ref<Produto | null>(null)
const custoAno = ref(new Date().getFullYear())
const custosForm = ref<Record<number, number>>({})

// Unidades
const unidadesModalOpen = ref(false)
const unidadeEditModalOpen = ref(false)
const deleteUnidadeModalOpen = ref(false)
const editingUnidade = ref<Unidade | null>(null)
const deletingUnidade = ref<Unidade | null>(null)
const savingUnidade = ref(false)
const deletingUnidadeLoading = ref(false)
const unidadeForm = ref({
  sigla: '',
  descricao: ''
})

const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const form = ref({
  nome: '',
  grupo_id: '',
  subgrupo_id: '',
  unidade_id: '',
  estoque_minimo: 0,
  margem_seguranca: 0,
  tempo_reposicao: 0,
  ativo: true
})


const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'subgrupo', label: 'Grupo / Subgrupo', sortable: true },
  { key: 'unidade', label: 'Unid.', sortable: true },
  { key: 'estoque_inicial', label: 'Est. Inicial' },
  { key: 'preco_inicial', label: 'Preço Inicial' },
  { key: 'actions', label: '', class: 'text-right', rowClass: 'text-right' }
]

const unidadesColumns = [
  { key: 'sigla', label: 'Sigla', sortable: true },
  { key: 'descricao', label: 'Descrição', sortable: true },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativos', value: 'true' },
  { label: 'Inativos', value: 'false' }
]

// Filtro expansível Grupo/Subgrupo
const filterCategoriaLabel = computed(() => {
  if (!filterCategoria.value) return 'Todos'
  if (filterCategoria.value.startsWith('g:')) {
    const id = filterCategoria.value.slice(2)
    return grupos.value.find(g => g.id === id)?.nome || 'Grupo'
  }
  if (filterCategoria.value.startsWith('s:')) {
    const id = filterCategoria.value.slice(2)
    const sub = subgrupos.value.find(s => s.id === id)
    return sub?.nome || 'Subgrupo'
  }
  return 'Grupo / Subgrupo'
})

const subgruposDe = (grupoId: string) => {
  return subgrupos.value.filter(s => s.grupo_id === grupoId)
}

const toggleGrupoExpand = (grupoId: string) => {
  const newSet = new Set(expandedGrupos.value)
  if (newSet.has(grupoId)) {
    newSet.delete(grupoId)
  } else {
    newSet.add(grupoId)
  }
  expandedGrupos.value = newSet
}

const selectCategoria = (value: string) => {
  filterCategoria.value = value
  categoriaPopoverOpen.value = false
}

const gruposSelect = computed(() =>
  grupos.value.map(g => ({ label: g.nome, value: g.id }))
)

const subgruposSelectFiltered = computed(() => {
  if (!form.value.grupo_id) return []
  return subgrupos.value
    .filter(s => s.grupo_id === form.value.grupo_id)
    .map(s => ({ label: s.nome, value: s.id }))
})

const unidadesSelect = computed(() =>
  unidades.value.map(u => ({ label: `${u.sigla} - ${u.descricao || u.sigla}`, value: u.id }))
)

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const filteredProdutos = computed(() => {
  let result = [...produtos.value]

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.subgrupo?.nome?.toLowerCase().includes(term) ||
      p.subgrupo?.grupo?.nome?.toLowerCase().includes(term)
    )
  }

  if (filterCategoria.value) {
    if (filterCategoria.value.startsWith('g:')) {
      const grupoId = filterCategoria.value.slice(2)
      result = result.filter(p => p.subgrupo?.grupo_id === grupoId)
    } else if (filterCategoria.value.startsWith('s:')) {
      const subgrupoId = filterCategoria.value.slice(2)
      result = result.filter(p => p.subgrupo_id === subgrupoId)
    }
  }

  if (filterStatus.value !== '') {
    const isActive = filterStatus.value === 'true'
    result = result.filter(p => p.ativo === isActive)
  }

  return result
})

const { page, pageSize, paginatedItems } = usePagination(filteredProdutos)

// Busca produtos similares ao digitar o nome (apenas no cadastro novo)
const produtosSimilares = computed(() => {
  const nome = form.value.nome.trim()
  if (!nome || nome.length < 3 || editingProduto.value) return []

  const termo = nome.toLowerCase()
  return produtos.value.filter(p => {
    const nomeProduto = p.nome.toLowerCase()
    // Verifica se contém o termo ou se o termo contém o nome do produto
    if (nomeProduto.includes(termo) || termo.includes(nomeProduto)) return true
    // Verifica similaridade por palavras em comum
    const palavrasTermo = termo.split(/\s+/).filter(w => w.length > 2)
    const palavrasProduto = nomeProduto.split(/\s+/).filter(w => w.length > 2)
    const palavrasComuns = palavrasTermo.filter(pt =>
      palavrasProduto.some(pp => pp.includes(pt) || pt.includes(pp))
    )
    return palavrasComuns.length > 0 && palavrasTermo.length > 0
  }).slice(0, 5) // Limita a 5 resultados
})

// Formata texto com primeira letra maiúscula e resto minúsculo
const formatarNome = (texto: string) => {
  if (!texto) return ''
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase()
}

const truncate2 = (v: number) => Math.trunc((v || 0) * 100) / 100

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
}

const { formatCurrency } = useFormatters()

const loadData = async () => {
  try {
    loading.value = true
    const [prods, grps, subgrps, unids] = await Promise.all([
      getProdutos(false),
      getGrupos(),
      getSubgrupos(),
      getUnidades()
    ])
    produtos.value = prods
    grupos.value = grps
    subgrupos.value = subgrps
    unidades.value = unids
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar dados',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

const openModal = async (produto?: Produto) => {
  if (produto) {
    editingProduto.value = produto
    form.value = {
      nome: produto.nome,
      grupo_id: produto.subgrupo?.grupo_id || '',
      subgrupo_id: produto.subgrupo_id || '',
      unidade_id: produto.unidade_id,
      estoque_minimo: produto.estoque_minimo,
      margem_seguranca: produto.margem_seguranca,
      tempo_reposicao: produto.tempo_reposicao,
      ativo: produto.ativo
    }
  } else {
    editingProduto.value = null
    form.value = {
      nome: '',
      grupo_id: '',
      subgrupo_id: '',
      unidade_id: '',
      estoque_minimo: 0,
      margem_seguranca: 0,
      tempo_reposicao: 0,
      ativo: true
    }
  }
  modalOpen.value = true
}

const openCustosModal = async (produto: Produto) => {
  selectedProduto.value = produto
  custosForm.value = {}

  try {
    const custos = await getCustosMensais(produto.id, custoAno.value)
    custos.forEach(c => {
      custosForm.value[c.mes] = c.custo
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar custos',
      color: 'red'
    })
  }

  custosModalOpen.value = true
}

const saveCustoMensal = async (mes: number) => {
  if (!selectedProduto.value) return

  const custo = custosForm.value[mes] || 0
  try {
    await upsertCustoMensal({
      produto_id: selectedProduto.value.id,
      ano: custoAno.value,
      mes,
      custo
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar custo',
      color: 'red'
    })
  }
}

watch(custoAno, async () => {
  if (selectedProduto.value) {
    custosForm.value = {}
    try {
      const custos = await getCustosMensais(selectedProduto.value.id, custoAno.value)
      custos.forEach(c => {
        custosForm.value[c.mes] = c.custo
      })
    } catch (error) {
    }
  }
})

const saveProduto = async () => {
  if (!form.value.nome || !form.value.subgrupo_id || !form.value.unidade_id) {
    toast.add({
      title: 'Erro',
      description: 'Nome, subgrupo e unidade são obrigatórios',
      color: 'red'
    })
    return
  }

  await executeSaveProduto()
}

const executeSaveProduto = async () => {
  // Formata o nome antes de salvar
  form.value.nome = formatarNome(form.value.nome)

  // Prepara dados para enviar (sem grupo_id que é apenas para o formulário)
  const dadosProduto = {
    nome: form.value.nome,
    subgrupo_id: form.value.subgrupo_id,
    unidade_id: form.value.unidade_id,
    estoque_minimo: form.value.estoque_minimo,
    margem_seguranca: form.value.margem_seguranca,
    tempo_reposicao: form.value.tempo_reposicao,
    ativo: form.value.ativo
  }

  try {
    saving.value = true
    if (editingProduto.value) {
      await updateProduto(editingProduto.value.id, dadosProduto)

      toast.add({
        title: 'Sucesso',
        description: 'Produto atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createProduto(dadosProduto)

      toast.add({
        title: 'Sucesso',
        description: 'Produto criado com sucesso',
        color: 'green'
      })
      // Volta para página 1 ao criar novo produto
      page.value = 1
    }
    modalOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar produto',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

const confirmDelete = (produto: Produto) => {
  deletingProduto.value = produto
  deleteModalOpen.value = true
}

const deleteProduto = async () => {
  if (!deletingProduto.value) return

  try {
    deleting.value = true
    await removeProduto(deletingProduto.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Produto desativado com sucesso',
      color: 'green'
    })
    deleteModalOpen.value = false
    await loadData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao desativar produto',
      color: 'red'
    })
  } finally {
    deleting.value = false
  }
}

// ==========================================
// Funções de Unidades
// ==========================================

const openUnidadesModal = () => {
  unidadesModalOpen.value = true
}

const onUnidadesModalClose = () => {
  // Recarrega unidades caso tenham sido alteradas
  loadData()
}

const openUnidadeEditModal = (unidade?: Unidade) => {
  if (unidade) {
    editingUnidade.value = unidade
    unidadeForm.value = {
      sigla: unidade.sigla,
      descricao: unidade.descricao || ''
    }
  } else {
    editingUnidade.value = null
    unidadeForm.value = { sigla: '', descricao: '' }
  }
  unidadeEditModalOpen.value = true
}

const saveUnidade = async () => {
  if (!unidadeForm.value.sigla) {
    toast.add({
      title: 'Erro',
      description: 'A sigla é obrigatória',
      color: 'red'
    })
    return
  }

  // Formata a sigla (maiúscula) e descrição
  unidadeForm.value.sigla = unidadeForm.value.sigla.toUpperCase()
  if (unidadeForm.value.descricao) {
    unidadeForm.value.descricao = formatarNome(unidadeForm.value.descricao)
  }

  try {
    savingUnidade.value = true
    if (editingUnidade.value) {
      await updateUnidade(editingUnidade.value.id, unidadeForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Unidade atualizada com sucesso',
        color: 'green'
      })
    } else {
      await createUnidade(unidadeForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Unidade criada com sucesso',
        color: 'green'
      })
    }
    unidadeEditModalOpen.value = false
    editingUnidade.value = null
    unidadeForm.value = { sigla: '', descricao: '' }
    unidades.value = await getUnidades()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar unidade'
    if (error.message?.includes('unidades_sigla_key') || error.code === '23505') {
      mensagem = 'Já existe uma unidade com essa sigla'
    }
    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    savingUnidade.value = false
  }
}

const confirmDeleteUnidade = (unidade: Unidade) => {
  deletingUnidade.value = unidade
  deleteUnidadeModalOpen.value = true
}

const deleteUnidade = async () => {
  if (!deletingUnidade.value) return

  try {
    deletingUnidadeLoading.value = true
    await removeUnidade(deletingUnidade.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Unidade excluída com sucesso',
      color: 'green'
    })
    deleteUnidadeModalOpen.value = false
    unidades.value = await getUnidades()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir unidade',
      color: 'red'
    })
  } finally {
    deletingUnidadeLoading.value = false
  }
}

// ==========================================
// Funções de Grupos e Subgrupos
// ==========================================

const gruposModalOpen = ref(false)
const grupoEditModalOpen = ref(false)
const subgrupoEditModalOpen = ref(false)
const deleteGrupoModalOpen = ref(false)
const deleteSubgrupoModalOpen = ref(false)
const loadingGrupos = ref(false)
const savingGrupoItem = ref(false)
const savingSubgrupoItem = ref(false)
const deletingGrupoItemLoading = ref(false)
const deletingSubgrupoItemLoading = ref(false)
const editingGrupoItem = ref<Grupo | null>(null)
const editingSubgrupoItem = ref<Subgrupo | null>(null)
const deletingGrupoItem = ref<Grupo | null>(null)
const deletingSubgrupoItem = ref<Subgrupo | null>(null)
const grupoEditForm = ref({ nome: '' })
const subgrupoEditForm = ref({ grupo_id: '', nome: '' })
const preSelectedGrupoIdForEdit = ref<string | null>(null)

// Dados separados para o modal de grupos (para não misturar com os filtros)
const gruposData = ref<Grupo[]>([])
const subgruposData = ref<Subgrupo[]>([])

const gruposSelectForSubgrupo = computed(() =>
  gruposData.value.map(g => ({ label: g.nome, value: g.id }))
)

const getSubgruposDoGrupo = (grupoId: string) => {
  return subgruposData.value.filter(s => s.grupo_id === grupoId)
}

const loadGruposData = async () => {
  try {
    loadingGrupos.value = true
    const [grps, subgrps] = await Promise.all([
      getGrupos(),
      getSubgrupos()
    ])
    gruposData.value = grps
    subgruposData.value = subgrps
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao carregar grupos',
      color: 'red'
    })
  } finally {
    loadingGrupos.value = false
  }
}

const openGruposModal = () => {
  gruposModalOpen.value = true
  loadGruposData()
}

const onGruposModalClose = () => {
  // Atualiza os dados da página principal (grupos e subgrupos podem ter mudado)
  loadData()
}

// Grupo CRUD
const openGrupoEditModal = (grupo?: Grupo) => {
  if (grupo) {
    editingGrupoItem.value = grupo
    grupoEditForm.value = { nome: grupo.nome }
  } else {
    editingGrupoItem.value = null
    grupoEditForm.value = { nome: '' }
  }
  grupoEditModalOpen.value = true
}

const saveGrupoItem = async () => {
  if (!grupoEditForm.value.nome) {
    toast.add({
      title: 'Erro',
      description: 'O nome é obrigatório',
      color: 'red'
    })
    return
  }

  grupoEditForm.value.nome = formatarNome(grupoEditForm.value.nome)

  try {
    savingGrupoItem.value = true
    if (editingGrupoItem.value) {
      await updateGrupo(editingGrupoItem.value.id, grupoEditForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Grupo atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createGrupo(grupoEditForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Grupo criado com sucesso',
        color: 'green'
      })
    }
    grupoEditModalOpen.value = false
    await loadGruposData()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar grupo'
    if (error.message?.includes('grupos_nome_key') || error.code === '23505') {
      mensagem = 'Já existe um grupo com esse nome'
    }
    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    savingGrupoItem.value = false
  }
}

const confirmDeleteGrupoItem = (grupo: Grupo) => {
  deletingGrupoItem.value = grupo
  deleteGrupoModalOpen.value = true
}

const deleteGrupoItem = async () => {
  if (!deletingGrupoItem.value) return

  try {
    deletingGrupoItemLoading.value = true
    await removeGrupo(deletingGrupoItem.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Grupo excluído com sucesso',
      color: 'green'
    })
    deleteGrupoModalOpen.value = false
    await loadGruposData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir grupo',
      color: 'red'
    })
  } finally {
    deletingGrupoItemLoading.value = false
  }
}

// Subgrupo CRUD
const openSubgrupoEditModal = (subgrupo?: Subgrupo, grupoId?: string) => {
  preSelectedGrupoIdForEdit.value = null

  if (subgrupo) {
    editingSubgrupoItem.value = subgrupo
    subgrupoEditForm.value = {
      grupo_id: subgrupo.grupo_id,
      nome: subgrupo.nome
    }
  } else {
    editingSubgrupoItem.value = null
    subgrupoEditForm.value = {
      grupo_id: grupoId || '',
      nome: ''
    }
    if (grupoId) {
      preSelectedGrupoIdForEdit.value = grupoId
    }
  }
  subgrupoEditModalOpen.value = true
}

const saveSubgrupoItem = async () => {
  if (!subgrupoEditForm.value.grupo_id || !subgrupoEditForm.value.nome) {
    toast.add({
      title: 'Erro',
      description: 'Grupo e nome são obrigatórios',
      color: 'red'
    })
    return
  }

  subgrupoEditForm.value.nome = formatarNome(subgrupoEditForm.value.nome)

  try {
    savingSubgrupoItem.value = true
    if (editingSubgrupoItem.value) {
      await updateSubgrupo(editingSubgrupoItem.value.id, { nome: subgrupoEditForm.value.nome })
      toast.add({
        title: 'Sucesso',
        description: 'Subgrupo atualizado com sucesso',
        color: 'green'
      })
    } else {
      await createSubgrupo(subgrupoEditForm.value)
      toast.add({
        title: 'Sucesso',
        description: 'Subgrupo criado com sucesso',
        color: 'green'
      })
    }
    subgrupoEditModalOpen.value = false
    await loadGruposData()
  } catch (error: any) {
    let mensagem = 'Erro ao salvar subgrupo'
    if (error.code === '23505') {
      mensagem = 'Já existe um subgrupo com esse nome neste grupo'
    }
    toast.add({
      title: 'Erro',
      description: mensagem,
      color: 'red'
    })
  } finally {
    savingSubgrupoItem.value = false
  }
}

const confirmDeleteSubgrupoItem = (subgrupo: Subgrupo) => {
  deletingSubgrupoItem.value = subgrupo
  deleteSubgrupoModalOpen.value = true
}

const deleteSubgrupoItem = async () => {
  if (!deletingSubgrupoItem.value) return

  try {
    deletingSubgrupoItemLoading.value = true
    await removeSubgrupo(deletingSubgrupoItem.value.id)
    toast.add({
      title: 'Sucesso',
      description: 'Subgrupo excluído com sucesso',
      color: 'green'
    })
    deleteSubgrupoModalOpen.value = false
    await loadGruposData()
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao excluir subgrupo',
      color: 'red'
    })
  } finally {
    deletingSubgrupoItemLoading.value = false
  }
}

// ==========================================
// Fix: HeadlessUI FocusTrap conflict (slideover + modal)
// Quando um UModal abre sobre um USlideover, o FocusTrap do slideover
// pode interferir nos inputs do modal. Solução: setar 'inert' no painel
// do slideover enquanto um sub-modal estiver aberto.
// ==========================================
const anyGrupoSubModalOpen = computed(() =>
  grupoEditModalOpen.value || subgrupoEditModalOpen.value ||
  deleteGrupoModalOpen.value || deleteSubgrupoModalOpen.value
)

// Fix agora é declarativo via <div :inert="..."> dentro de cada USlideover template

// Realtime
const { onTableChange } = useRealtime()
onTableChange(['produtos', 'grupos', 'subgrupos', 'categorias', 'unidades', 'fornecedores'], () => loadData())

// Recarregar dados quando a empresa ativa mudar
watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
  }
}, { immediate: true })
</script>

<style scoped>
/* Impede dimming visual do atributo inert nos slideoverss */
:deep([inert]) {
  opacity: 1 !important;
  filter: none !important;
}

/* Normaliza botões de colunas sortable para ficarem iguais aos headers não-sortable */
:deep(table thead th button) {
  color: #5a5a66 !important;
  font-weight: 500 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.05em !important;
  font-size: 0.75rem !important;
  line-height: 1rem !important;
}

/* Esconde ícone de sort no estado padrão (não-ordenado) */
:deep(table thead th button [class*="i-heroicons-arrows-up-down"]) {
  display: none;
}
</style>
