<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Produtos</h1>
        <p class="text-sm text-gray-500">Gerencie o cadastro de produtos</p>
      </div>
      <div class="flex gap-2">
        <UButton color="white" class="w-full sm:w-auto" @click="openUnidadesModal()">
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-2" />
          Gerenciar Unidades
        </UButton>
        <UButton color="primary" class="w-full sm:w-auto" @click="openModal()">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-2" />
          Novo Produto
        </UButton>
      </div>
    </div>

    <!-- Filtros -->
    <UCard>
      <div class="flex flex-col sm:flex-row flex-wrap gap-4">
        <UInput
          v-model="search"
          placeholder="Buscar produto..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 min-w-0 sm:min-w-64"
        />
        <USelect
          v-model="filterGrupo"
          :options="grupoOptions"
          placeholder="Grupo"
          class="w-full sm:w-40"
          @change="filterSubgrupo = ''"
        />
        <USelect
          v-model="filterSubgrupo"
          :options="subgrupoFilterOptions"
          placeholder="Subgrupo"
          class="w-full sm:w-48"
        />
        <USelect
          v-model="filterStatus"
          :options="statusOptions"
          value-attribute="value"
          option-attribute="label"
          placeholder="Status"
          class="w-full sm:w-32"
        />
      </div>
    </UCard>

    <!-- Tabela Skeleton -->
    <UCard v-if="loading" :ui="{ body: { padding: '' } }">
      <div class="p-5 space-y-4">
        <div v-for="i in 8" :key="i" class="flex items-center gap-4">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-4 w-24" />
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-16" />
        </div>
      </div>
    </UCard>

    <!-- Tabela -->
    <UCard v-if="!loading" :ui="{ body: { padding: '' } }">
      <UTable
        :columns="columns"
        :rows="paginatedItems"
        :loading="loading"
        :ui="{
          td: { color: 'text-gray-700 dark:text-gray-200' },
          th: { color: 'text-gray-900 dark:text-white' }
        }"
      >
        <!-- Empty State -->
        <template #empty-state>
          <div class="flex flex-col items-center justify-center py-6 text-gray-500">
            <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
            <p class="text-sm">Nenhum registro encontrado</p>
          </div>
        </template>

        <template #nome-data="{ row }">
          <span class="font-semibold text-gray-900 dark:text-white">{{ row.nome }}</span>
        </template>

        <template #subgrupo-data="{ row }">
          <div class="flex flex-col">
            <UBadge color="gray" variant="soft">
              {{ row.subgrupo?.nome || '-' }}
            </UBadge>
            <span class="text-xs text-gray-400 mt-1">{{ row.subgrupo?.grupo?.nome || '' }}</span>
          </div>
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

        <template #ativo-data="{ row }">
          <UBadge :color="row.ativo ? 'green' : 'gray'">
            {{ row.ativo ? 'Ativo' : 'Inativo' }}
          </UBadge>
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
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
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
                :ui="editingProduto ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
                @change="form.subgrupo_id = ''"
              />
            </UFormGroup>

            <UFormGroup label="Subgrupo" required>
              <USelect
                v-model="form.subgrupo_id"
                :options="subgruposSelectFiltered"
                placeholder="Selecione o subgrupo"
                :disabled="!!editingProduto || !form.grupo_id"
                :ui="editingProduto || !form.grupo_id ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
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
                  :ui="editingProduto ? { color: { white: { outline: 'bg-gray-100 text-gray-500 cursor-not-allowed' } } } : {}"
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
                <span class="text-sm text-gray-600">{{ form.ativo ? 'Ativo' : 'Inativo' }}</span>
              </div>
            </UFormGroup>

            <!-- Beneficiamento -->
            <UFormGroup label="Esse produto vai ser beneficiado?" required>
              <USelect
                v-model="form.beneficiavel"
                :options="[
                  { label: 'Não', value: false },
                  { label: 'Sim', value: true }
                ]"
                value-attribute="value"
                option-attribute="label"
              />
            </UFormGroup>

            <!-- Eficiência do Beneficiamento -->
            <UFormGroup
              v-if="form.beneficiavel === true || form.beneficiavel === 'true'"
              label="Eficiência do beneficiamento (%)"
            >
              <UInput
                v-model.number="form.eficiencia_beneficiamento"
                type="number"
                min="1"
                max="100"
                step="0.1"
                placeholder="Ex: 90"
                :ui="{ icon: { trailing: { pointer: '' } } }"
              >
                <template #trailing>
                  <span class="text-gray-400 text-xs">%</span>
                </template>
              </UInput>
            </UFormGroup>
          </div>

          <!-- Produtos Finais do Beneficiamento -->
          <div v-if="form.beneficiavel === true || form.beneficiavel === 'true'" class="space-y-3 mt-2">
            <div class="border-t border-gray-200 pt-4">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-medium text-gray-700">
                  Produtos finais da produção
                </span>
                <UBadge
                  v-if="produtosFinaisExistentes.length + produtosFinais.length > 0"
                  color="purple" variant="subtle" size="xs"
                >
                  {{ produtosFinaisExistentes.length + produtosFinais.length }}
                  {{ (produtosFinaisExistentes.length + produtosFinais.length) === 1 ? 'produto' : 'produtos' }}
                </UBadge>
              </div>

              <!-- Loading -->
              <div v-if="loadingProdutosFinais" class="flex items-center gap-2 py-4 justify-center text-gray-400">
                <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                <span class="text-sm">Carregando produtos finais...</span>
              </div>

              <!-- Produtos finais já vinculados (ao editar) -->
              <div
                v-for="(link, index) in produtosFinaisExistentes"
                :key="'existing-' + link.id"
                class="relative group rounded-xl border border-purple-200 bg-purple-50/50 p-4 mb-3"
              >
                <button
                  type="button"
                  @click="removerProdutoFinalExistente(link.id, index)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                  title="Remover produto final"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>

                <div class="flex items-center gap-3">
                  <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p class="font-medium text-gray-900">{{ link.produto_final.nome }}</p>
                    <p class="text-xs text-gray-500">
                      {{ link.produto_final.subgrupo?.grupo?.nome }} / {{ link.produto_final.subgrupo?.nome }}
                      <span class="ml-1 text-gray-400">· {{ link.produto_final.unidade?.sigla }}</span>
                    </p>
                  </div>
                </div>
              </div>

              <!-- Novos produtos finais (formulário) -->
              <div
                v-for="(pf, index) in produtosFinais"
                :key="'new-' + index"
                class="relative group rounded-xl border border-gray-200 bg-gray-50/50 p-4 mb-3"
              >
                <button
                  v-if="produtosFinais.length > 1 || produtosFinaisExistentes.length > 0"
                  type="button"
                  @click="produtosFinais.splice(index, 1)"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600 z-10"
                >
                  <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                </button>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <UFormGroup label="Nome" required>
                    <UInput v-model="pf.nome" placeholder="Nome do produto final" />
                  </UFormGroup>
                  <UFormGroup label="Grupo" required>
                    <USelect
                      v-model="pf.grupo_id"
                      :options="gruposSelect"
                      placeholder="Selecione o grupo"
                      @change="pf.subgrupo_id = ''"
                    />
                  </UFormGroup>
                  <UFormGroup label="Subgrupo" required>
                    <USelect
                      v-model="pf.subgrupo_id"
                      :options="getSubgruposForPF(pf.grupo_id)"
                      placeholder="Selecione o subgrupo"
                      :disabled="!pf.grupo_id"
                    />
                  </UFormGroup>
                  <UFormGroup label="Unidade">
                    <div class="h-[38px] flex items-center px-3 bg-gray-100 border border-gray-300 rounded-md">
                      <span class="text-sm text-gray-600">UN - Unidade</span>
                    </div>
                  </UFormGroup>
                </div>
              </div>

              <!-- Botão adicionar produto final -->
              <button
                type="button"
                @click="produtosFinais.push({ nome: '', grupo_id: '', subgrupo_id: '' })"
                class="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/50 transition-all flex items-center justify-center gap-2"
              >
                <UIcon name="i-heroicons-plus-circle" class="w-5 h-5" />
                Adicionar produto final
              </button>
            </div>
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
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Custos Mensais</h3>
              <p class="text-sm text-gray-500">{{ selectedProduto?.nome }}</p>
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
              <UInput
                v-model.number="custosForm[mes]"
                type="number"
                step="0.01"
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
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
        </template>

        <p>Tem certeza que deseja desativar o produto <strong>{{ deletingProduto?.nome }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">O produto será marcado como inativo.</p>

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

    <!-- Modal de Gerenciamento de Unidades -->
    <UModal
      v-model="unidadesModalOpen"
      :prevent-close="deleteUnidadeModalOpen"
      :ui="{
        width: 'sm:max-w-2xl',
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
      @after-leave="onUnidadesModalClose"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
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

        <!-- Formulário de Nova Unidade -->
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 mb-3">{{ editingUnidade ? 'Editar Unidade' : 'Nova Unidade' }}</h4>
          <div class="flex gap-2">
            <UInput
              v-model="unidadeForm.sigla"
              placeholder="Sigla (ex: KG)"
              class="w-24"
              maxlength="10"
            />
            <UInput
              v-model="unidadeForm.descricao"
              placeholder="Descrição (ex: Quilograma)"
              class="flex-1"
            />
            <UButton
              color="primary"
              :loading="savingUnidade"
              @click="saveUnidade"
            >
              {{ editingUnidade ? 'Salvar' : 'Adicionar' }}
            </UButton>
            <UButton
              v-if="editingUnidade"
              color="gray"
              variant="ghost"
              @click="cancelEditUnidade"
            >
              Cancelar
            </UButton>
          </div>
        </div>

        <!-- Lista de Unidades -->
        <div class="max-h-80 overflow-y-auto border rounded-lg">
          <UTable
            :columns="unidadesColumns"
            :rows="unidades"
            :ui="{
              td: { color: 'text-gray-700 dark:text-gray-200' },
              th: { color: 'text-gray-900 dark:text-white' },
              thead: 'sticky top-0 bg-white dark:bg-gray-800 z-10'
            }"
          >
            <template #empty-state>
              <div class="flex flex-col items-center justify-center py-6 text-gray-500">
                <UIcon name="i-heroicons-inbox" class="w-8 h-8 mb-2" />
                <p class="text-sm">Nenhuma unidade cadastrada</p>
              </div>
            </template>

            <template #sigla-data="{ row }">
              <span class="font-semibold text-gray-900 dark:text-white">{{ row.sigla }}</span>
            </template>

            <template #descricao-data="{ row }">
              <span class="text-gray-600">{{ row.descricao || '—' }}</span>
            </template>

            <template #actions-data="{ row }">
              <div class="flex gap-1 justify-end">
                <UButton
                  color="gray"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  size="xs"
                  @click="editUnidade(row)"
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
    </UModal>

    <!-- Modal de Confirmação de Exclusão de Unidade -->
    <UModal
      v-model="deleteUnidadeModalOpen"
      :ui="{
        overlay: { background: 'bg-gray-900/50 backdrop-blur-sm' },
        background: 'bg-white dark:bg-gray-800',
        ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
        shadow: 'shadow-2xl'
      }"
    >
      <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-gray-100 dark:divide-gray-700' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
        </template>

        <p>Tem certeza que deseja excluir a unidade <strong>{{ deletingUnidade?.sigla }}</strong>?</p>
        <p class="text-sm text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>

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
  </div>
</template>

<script setup lang="ts">
import type { Produto, Grupo, Subgrupo, Unidade } from '~/types'

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
  createProdutoBeneficiamento,
  getProdutosBeneficiamento,
  deleteProdutoBeneficiamento
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
const filterGrupo = ref('')
const filterSubgrupo = ref('')
const filterStatus = ref('true')
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
const deleteUnidadeModalOpen = ref(false)
const editingUnidade = ref<Unidade | null>(null)
const deletingUnidade = ref<Unidade | null>(null)
const savingUnidade = ref(false)
const deletingUnidadeLoading = ref(false)
const openedFromProdutoModal = ref(false)
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
  beneficiavel: false as boolean | string,
  eficiencia_beneficiamento: null as number | null,
  ativo: true
})

// Beneficiamento - produtos finais
const produtosFinais = ref<Array<{
  nome: string
  grupo_id: string
  subgrupo_id: string
}>>([])

// Produtos finais já vinculados (ao editar)
const produtosFinaisExistentes = ref<Array<{
  id: string // id do vínculo (produtos_beneficiamento)
  produto_final: {
    id: string
    nome: string
    unidade?: { sigla: string }
    subgrupo?: { nome: string; grupo?: { nome: string } }
  }
}>>([])
const loadingProdutosFinais = ref(false)

const removerProdutoFinalExistente = async (vinculoId: string, index: number) => {
  try {
    await deleteProdutoBeneficiamento(vinculoId)
    produtosFinaisExistentes.value.splice(index, 1)
    toast.add({
      title: 'Sucesso',
      description: 'Produto final removido',
      color: 'green'
    })
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao remover produto final',
      color: 'red'
    })
  }
}

const getSubgruposForPF = (grupoId: string) => {
  if (!grupoId) return []
  return subgrupos.value
    .filter(s => s.grupo_id === grupoId)
    .map(s => ({ label: s.nome, value: s.id }))
}

const columns = [
  { key: 'nome', label: 'Nome', sortable: true },
  { key: 'subgrupo', label: 'Subgrupo', sortable: true },
  { key: 'unidade', label: 'Unid.', sortable: true },
  { key: 'estoque_inicial', label: 'Est. Inicial' },
  { key: 'preco_inicial', label: 'Preço Inicial' },
  { key: 'ativo', label: 'Status' },
  { key: 'actions', label: 'Ações', class: 'text-right', rowClass: 'text-right' }
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

const grupoOptions = computed(() => [
  { label: 'Todos', value: '' },
  ...grupos.value.map(g => ({ label: g.nome, value: g.id }))
])

const subgrupoFilterOptions = computed(() => {
  const options = [{ label: 'Todos', value: '' }]

  let filtered = subgrupos.value
  if (filterGrupo.value) {
    filtered = subgrupos.value.filter(s => s.grupo_id === filterGrupo.value)
  }

  return [...options, ...filtered.map(s => ({ label: s.nome, value: s.id }))]
})

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

const unidadeUNId = computed(() => {
  const un = unidades.value.find(u => u.sigla.toUpperCase() === 'UN')
  return un?.id || ''
})

const anosOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    label: String(currentYear - 2 + i),
    value: currentYear - 2 + i
  }))
})

const filteredProdutos = computed(() => {
  // Oculta produtos finais de beneficiamento da tabela principal
  let result = produtos.value.filter(p => !p.is_produto_final)

  if (search.value) {
    const term = search.value.toLowerCase()
    result = result.filter(p =>
      p.nome.toLowerCase().includes(term) ||
      p.subgrupo?.nome?.toLowerCase().includes(term) ||
      p.subgrupo?.grupo?.nome?.toLowerCase().includes(term)
    )
  }

  if (filterGrupo.value) {
    result = result.filter(p => p.subgrupo?.grupo_id === filterGrupo.value)
  }

  if (filterSubgrupo.value) {
    result = result.filter(p => p.subgrupo_id === filterSubgrupo.value)
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(truncate2(value))
}

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
  produtosFinais.value = []
  produtosFinaisExistentes.value = []
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
      beneficiavel: produto.beneficiavel || false,
      eficiencia_beneficiamento: produto.eficiencia_beneficiamento ?? null,
      ativo: produto.ativo
    }
    // Carrega produtos finais vinculados se for beneficiável
    if (produto.beneficiavel) {
      loadingProdutosFinais.value = true
      try {
        const links = await getProdutosBeneficiamento(produto.id)
        produtosFinaisExistentes.value = links as any
      } catch (e) {
        console.error('Erro ao carregar produtos finais:', e)
      } finally {
        loadingProdutosFinais.value = false
      }
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
      beneficiavel: false,
      eficiencia_beneficiamento: null,
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
      console.error('Erro ao carregar custos:', error)
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

  // Normaliza o valor do beneficiavel (USelect pode retornar string)
  const isBeneficiavel = form.value.beneficiavel === true || form.value.beneficiavel === 'true'

  // Validar produtos finais se beneficiável
  if (isBeneficiavel) {
    const totalFinais = produtosFinaisExistentes.value.length + produtosFinais.value.length
    if (totalFinais === 0) {
      toast.add({
        title: 'Atenção',
        description: 'Adicione pelo menos um produto final da produção',
        color: 'amber'
      })
      return
    }
    for (const pf of produtosFinais.value) {
      if (!pf.nome || !pf.subgrupo_id) {
        toast.add({
          title: 'Atenção',
          description: 'Preencha todos os campos dos produtos finais (nome, grupo e subgrupo)',
          color: 'amber'
        })
        return
      }
    }
  }

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
    beneficiavel: isBeneficiavel,
    eficiencia_beneficiamento: isBeneficiavel ? (form.value.eficiencia_beneficiamento || null) : null,
    ativo: form.value.ativo
  }

  try {
    saving.value = true
    if (editingProduto.value) {
      await updateProduto(editingProduto.value.id, dadosProduto)

      // Criar novos produtos finais adicionados durante edição
      if (isBeneficiavel && produtosFinais.value.length > 0) {
        for (const pf of produtosFinais.value) {
          const produtoFinal = await createProduto({
            nome: formatarNome(pf.nome),
            subgrupo_id: pf.subgrupo_id,
            unidade_id: unidadeUNId.value,
            estoque_inicial: 0,
            preco_inicial: 0,
            estoque_minimo: 0,
            margem_seguranca: 0,
            tempo_reposicao: 0,
            beneficiavel: false,
            is_produto_final: true,
            ativo: true
          })
          await createProdutoBeneficiamento({
            produto_origem_id: editingProduto.value.id,
            produto_final_id: produtoFinal.id
          })
        }
      }

      toast.add({
        title: 'Sucesso',
        description: produtosFinais.value.length > 0
          ? `Produto atualizado e ${produtosFinais.value.length} produto(s) final(is) adicionado(s)`
          : 'Produto atualizado com sucesso',
        color: 'green'
      })
    } else {
      const novoProduto = await createProduto(dadosProduto)

      // Se beneficiável, criar produtos finais e vincular
      if (isBeneficiavel) {
        for (const pf of produtosFinais.value) {
          const produtoFinal = await createProduto({
            nome: formatarNome(pf.nome),
            subgrupo_id: pf.subgrupo_id,
            unidade_id: unidadeUNId.value,
            estoque_inicial: 0,
            preco_inicial: 0,
            estoque_minimo: 0,
            margem_seguranca: 0,
            tempo_reposicao: 0,
            beneficiavel: false,
            is_produto_final: true,
            ativo: true
          })
          await createProdutoBeneficiamento({
            produto_origem_id: novoProduto.id,
            produto_final_id: produtoFinal.id
          })
        }
      }

      toast.add({
        title: 'Sucesso',
        description: isBeneficiavel
          ? `Produto e ${produtosFinais.value.length} produto(s) final(is) criados com sucesso`
          : 'Produto criado com sucesso',
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
  editingUnidade.value = null
  unidadeForm.value = { sigla: '', descricao: '' }

  // Se o modal de produtos está aberto, fecha ele antes de abrir o de unidades
  // para evitar conflito de FocusTrap entre dois Dialogs irmãos (Headless UI)
  if (modalOpen.value) {
    openedFromProdutoModal.value = true
    modalOpen.value = false
    // Aguarda a transição de saída do modal de produtos (300ms) antes de abrir o de unidades
    setTimeout(() => {
      unidadesModalOpen.value = true
    }, 350)
  } else {
    openedFromProdutoModal.value = false
    unidadesModalOpen.value = true
  }
}

const onUnidadesModalClose = () => {
  // Se foi aberto a partir do modal de produtos, reabre ele
  if (openedFromProdutoModal.value) {
    openedFromProdutoModal.value = false
    nextTick(() => {
      modalOpen.value = true
    })
  }
}

const editUnidade = (unidade: Unidade) => {
  editingUnidade.value = unidade
  unidadeForm.value = {
    sigla: unidade.sigla,
    descricao: unidade.descricao || ''
  }
}

const cancelEditUnidade = () => {
  editingUnidade.value = null
  unidadeForm.value = { sigla: '', descricao: '' }
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

// Recarregar dados quando a empresa ativa mudar
watch(empresaId, () => {
  if (empresaId.value) {
    loadData()
  }
}, { immediate: true })
</script>
