<template>
  <UModal
    v-model="isOpen"
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
            {{ editando ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormGroup label="Nome da Ficha" required class="md:col-span-2">
            <UInput v-model="form.nome" placeholder="Ex: Molho Bolonhesa 5kg" />
          </UFormGroup>

          <UFormGroup label="Produto Produzido" required>
            <USelectMenu
              v-model="form.produto_id"
              :options="produtosOptions"
              searchable
              searchable-placeholder="Buscar produto..."
              placeholder="Selecione o produto"
              value-attribute="value"
              option-attribute="label"
            />
          </UFormGroup>

          <UFormGroup :label="`Rendimento (${unidadeProduto})`" required>
            <UInput v-model.number="form.rendimento" type="number" step="0.01" min="0.01" placeholder="1" />
          </UFormGroup>
        </div>

        <UFormGroup label="Observações">
          <UTextarea v-model="form.observacao" placeholder="Modo de preparo, dicas..." :rows="2" />
        </UFormGroup>

        <!-- Ingredientes -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-operacao-700">Ingredientes</label>
            <UButton size="xs" color="primary" variant="soft" @click="adicionarIngrediente">
              <UIcon name="i-heroicons-plus" class="w-3.5 h-3.5 mr-1" />
              Adicionar
            </UButton>
          </div>

          <div v-if="ingredientes.length === 0" class="text-center py-6 text-operacao-400 text-sm">
            Nenhum ingrediente adicionado
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(ing, idx) in ingredientes"
              :key="idx"
              class="flex items-start gap-2 p-3 rounded-lg bg-operacao-50 border border-operacao-100"
            >
              <div class="flex-1 grid grid-cols-12 gap-2">
                <div class="col-span-6">
                  <USelectMenu
                    v-model="ing.produto_id"
                    :options="ingredientesOptions"
                    searchable
                    searchable-placeholder="Buscar ingrediente..."
                    placeholder="Ingrediente"
                    value-attribute="value"
                    option-attribute="label"
                    size="sm"
                  />
                </div>
                <div class="col-span-3">
                  <UInput
                    v-model.number="ing.quantidade"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="Qtd"
                    size="sm"
                  />
                </div>
                <div class="col-span-3">
                  <UInput
                    v-model.number="ing.fator_correcao"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="FC"
                    size="sm"
                  >
                    <template #trailing>
                      <span class="text-xs text-operacao-400">Perda</span>
                    </template>
                  </UInput>
                </div>
              </div>
              <UButton
                color="red"
                variant="ghost"
                icon="i-heroicons-trash"
                size="xs"
                class="mt-1"
                @click="removerIngrediente(idx)"
              />
            </div>
          </div>

          <!-- Custo estimado -->
          <div v-if="ingredientes.length > 0" class="mt-4 flex items-center justify-between p-3 bg-guardian-50 rounded-lg border border-guardian-200">
            <span class="text-sm font-medium text-guardian-700">Custo estimado do batch</span>
            <span class="text-sm font-semibold text-guardian-800">{{ formatCurrency(custoEstimado) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="isOpen = false">
            Cancelar
          </UButton>
          <UButton color="primary" class="w-full sm:w-auto" :loading="salvando" :disabled="!formValido" @click="salvar">
            {{ editando ? 'Salvar' : 'Criar' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
import type { Produto, FichaTecnica } from '~/types'

const props = defineProps<{
  modelValue: boolean
  ficha?: FichaTecnica | null
  produtos: Produto[]
  custosMap?: Map<string, number>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'salvo': []
}>()

const { createFichaTecnica, updateFichaTecnica } = useProducao()
const { formatCurrency } = useFormatters()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const editando = computed(() => !!props.ficha)

const form = ref({
  nome: '',
  produto_id: '',
  rendimento: 1,
  observacao: ''
})

const ingredientes = ref<Array<{
  produto_id: string
  quantidade: number
  fator_correcao: number
}>>([])

const salvando = ref(false)

const produtosOptions = computed(() =>
  props.produtos.map(p => ({
    value: p.id,
    label: `${p.nome} (${p.unidade?.sigla || ''})`
  }))
)

const ingredientesOptions = computed(() =>
  props.produtos
    .filter(p => p.id !== form.value.produto_id)
    .map(p => ({
      value: p.id,
      label: `${p.nome} (${p.unidade?.sigla || ''})`
    }))
)

const unidadeProduto = computed(() => {
  const p = props.produtos.find(p => p.id === form.value.produto_id)
  return p?.unidade?.sigla || 'un'
})

// Custo estimado (custo total do batch = soma de cada ingrediente × custo médio)
const custoEstimado = computed(() => {
  return ingredientes.value.reduce((acc, ing) => {
    const custo = props.custosMap?.get(ing.produto_id) || 0
    return acc + (custo * ing.quantidade * ing.fator_correcao)
  }, 0)
})

const formValido = computed(() =>
  form.value.nome.trim() &&
  form.value.produto_id &&
  form.value.rendimento > 0 &&
  ingredientes.value.length > 0 &&
  ingredientes.value.every(i => i.produto_id && i.quantidade > 0)
)

const adicionarIngrediente = () => {
  ingredientes.value.push({
    produto_id: '',
    quantidade: 0,
    fator_correcao: 1.0
  })
}

const removerIngrediente = (idx: number) => {
  ingredientes.value.splice(idx, 1)
}

const salvar = async () => {
  if (!formValido.value) return
  salvando.value = true

  try {
    if (editando.value && props.ficha) {
      await updateFichaTecnica(props.ficha.id, form.value, ingredientes.value)
      toast.add({ title: 'Ficha atualizada com sucesso', color: 'green' })
    } else {
      await createFichaTecnica(form.value, ingredientes.value)
      toast.add({ title: 'Ficha criada com sucesso', color: 'green' })
    }
    emit('salvo')
    isOpen.value = false
  } catch (e: any) {
    toast.add({ title: 'Erro ao salvar ficha', description: e.message, color: 'red' })
  } finally {
    salvando.value = false
  }
}

// Preencher form ao abrir / limpar ao fechar
watch(isOpen, (open) => {
  if (open && props.ficha) {
    // Editar: preencher com dados da ficha
    form.value = {
      nome: props.ficha.nome,
      produto_id: props.ficha.produto_id,
      rendimento: props.ficha.rendimento,
      observacao: props.ficha.observacao || ''
    }
    ingredientes.value = (props.ficha.ingredientes || []).map(ing => ({
      produto_id: ing.produto_id,
      quantidade: ing.quantidade,
      fator_correcao: ing.fator_correcao
    }))
  } else {
    // Criar novo ou fechou: limpar
    form.value = { nome: '', produto_id: '', rendimento: 1, observacao: '' }
    ingredientes.value = []
  }
})
</script>
