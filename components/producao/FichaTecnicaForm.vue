<template>
  <USlideover v-model="isOpen" :ui="{ width: 'max-w-2xl' }">
    <div class="flex flex-col h-full">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-operacao-200">
        <h3 class="text-lg font-semibold text-operacao-800">
          {{ editando ? 'Editar Ficha Técnica' : 'Nova Ficha Técnica' }}
        </h3>
        <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="fechar" />
      </div>

      <!-- Corpo -->
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-5">
        <!-- Nome -->
        <UFormGroup label="Nome da Ficha">
          <UInput v-model="form.nome" placeholder="Ex: Molho Bolonhesa 5kg" />
        </UFormGroup>

        <!-- Produto (resultado) -->
        <UFormGroup label="Produto Produzido">
          <USelectMenu
            v-model="form.produto_id"
            :options="produtosOptions"
            searchable
            searchable-placeholder="Buscar produto..."
            placeholder="Selecione o produto"
            value-attribute="value"
            option-attribute="label"
            :ui="{ input: 'block w-full' }"
          />
        </UFormGroup>

        <!-- Rendimento -->
        <UFormGroup :label="`Rendimento (${unidadeProduto})`">
          <UInput v-model.number="form.rendimento" type="number" step="0.01" min="0.01" placeholder="1" />
        </UFormGroup>

        <!-- Observação -->
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
                <!-- Produto -->
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
                <!-- Quantidade -->
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
                <!-- Fator Correção -->
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
                      <span class="text-xs text-operacao-400">FC</span>
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
            <span class="text-sm font-medium text-guardian-700">Custo estimado ({{ form.rendimento || 1 }}x)</span>
            <span class="text-sm font-semibold text-guardian-800">{{ formatCurrency(custoEstimado) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-operacao-200">
        <UButton color="white" @click="fechar">Cancelar</UButton>
        <UButton color="primary" :loading="salvando" :disabled="!formValido" @click="salvar">
          {{ editando ? 'Salvar Alterações' : 'Criar Ficha' }}
        </UButton>
      </div>
    </div>
  </USlideover>
</template>

<script setup lang="ts">
import type { Produto, FichaTecnica } from '~/types'

const props = defineProps<{
  modelValue: boolean
  ficha?: FichaTecnica | null
  produtos: Produto[]
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

// Options para selects
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

// Custo estimado
const custoEstimado = computed(() => {
  return ingredientes.value.reduce((acc, ing) => {
    const produto = props.produtos.find(p => p.id === ing.produto_id)
    // Estimativa simples: usar preco_inicial como placeholder
    const custo = produto?.preco_inicial || 0
    return acc + (custo * ing.quantidade * ing.fator_correcao * (form.value.rendimento || 1))
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

const fechar = () => {
  isOpen.value = false
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
    fechar()
  } catch (e: any) {
    toast.add({ title: 'Erro ao salvar ficha', description: e.message, color: 'red' })
  } finally {
    salvando.value = false
  }
}

// Preencher form ao editar
watch(() => props.ficha, (ficha) => {
  if (ficha) {
    form.value = {
      nome: ficha.nome,
      produto_id: ficha.produto_id,
      rendimento: ficha.rendimento,
      observacao: ficha.observacao || ''
    }
    ingredientes.value = (ficha.ingredientes || []).map(ing => ({
      produto_id: ing.produto_id,
      quantidade: ing.quantidade,
      fator_correcao: ing.fator_correcao
    }))
  } else {
    form.value = { nome: '', produto_id: '', rendimento: 1, observacao: '' }
    ingredientes.value = []
  }
}, { immediate: true })

watch(isOpen, (open) => {
  if (!open) {
    form.value = { nome: '', produto_id: '', rendimento: 1, observacao: '' }
    ingredientes.value = []
  }
})
</script>
