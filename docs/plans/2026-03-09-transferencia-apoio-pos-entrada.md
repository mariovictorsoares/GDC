# Transferência para Apoio pós-Entrada — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Após registrar entradas, abrir automaticamente um modal para o usuário transferir produtos ao estoque de apoio.

**Architecture:** Novo componente modal (`TransferenciaApoioModal.vue`) acionado pela página de entradas após criação bem-sucedida. Configuração toggle salva na tabela `empresas` (campo `sugerir_transferencia_apoio`). Saídas criadas via `createSaida({ tipo: 'transferencia' })`.

**Tech Stack:** Nuxt 3, Nuxt UI (UModal, UCard, UButton, etc.), Supabase, Tailwind CSS.

---

### Task 1: Adicionar campo `sugerir_transferencia_apoio` no tipo Empresa

**Files:**
- Modify: `types/index.ts:3-12`

**Step 1: Adicionar campo ao type**

No `interface Empresa`, adicionar o campo opcional:

```typescript
export interface Empresa {
  id: string
  nome: string
  cnpj?: string
  logo_url?: string
  ativo: boolean
  created_at?: string
  sugerir_transferencia_apoio?: boolean
  // Campo extra vindo do join (não persiste)
  papel?: string
}
```

**Step 2: Adicionar coluna no Supabase**

Rodar via SQL Editor no Supabase Dashboard:

```sql
ALTER TABLE empresas
ADD COLUMN sugerir_transferencia_apoio boolean DEFAULT true;
```

> Nota: default `true` — o recurso vem ativado por padrão.

**Step 3: Commit**

```bash
git add types/index.ts
git commit -m "feat: add sugerir_transferencia_apoio field to Empresa type"
```

---

### Task 2: Toggle de configuração no modal de Configurações

**Files:**
- Modify: `layouts/default.vue`

**Step 1: Adicionar seção de preferências entre assinatura e perfil**

Após o `<!-- Divider -->` (linha ~477) e antes do `<!-- Perfil -->`, adicionar:

```html
<!-- Preferências -->
<div class="space-y-3">
  <p class="text-xs font-semibold text-operacao-500 uppercase tracking-wider">Preferências</p>
  <div class="flex items-center justify-between p-3 bg-operacao-50 rounded-xl">
    <div class="flex items-center gap-3">
      <div class="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-blue-100">
        <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4.5 h-4.5 text-blue-600" />
      </div>
      <div>
        <p class="text-sm font-semibold text-operacao-800">Sugerir transferência para apoio</p>
        <p class="text-xs text-operacao-400">Após registrar entradas, sugerir envio ao estoque de apoio</p>
      </div>
    </div>
    <button
      type="button"
      class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-guardian-500 focus:ring-offset-2"
      :class="empresaAtiva?.sugerir_transferencia_apoio !== false ? 'bg-guardian-600' : 'bg-operacao-200'"
      @click="toggleSugerirApoio"
    >
      <span
        class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
        :class="empresaAtiva?.sugerir_transferencia_apoio !== false ? 'translate-x-5' : 'translate-x-0'"
      />
    </button>
  </div>
</div>

<!-- Divider -->
<div class="border-t border-operacao-100" />
```

**Step 2: Adicionar função toggleSugerirApoio no script**

```typescript
const toggleSugerirApoio = async () => {
  if (!empresaAtiva.value) return
  const novoValor = empresaAtiva.value.sugerir_transferencia_apoio === false ? true : false
  try {
    await atualizarEmpresa(empresaAtiva.value.id, { sugerir_transferencia_apoio: novoValor } as Partial<Empresa>)
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao salvar preferência',
      color: 'red'
    })
  }
}
```

> Nota: `atualizarEmpresa` já está importado de `useEmpresa()` nesse layout.

**Step 3: Commit**

```bash
git add layouts/default.vue
git commit -m "feat: add toggle for sugerir_transferencia_apoio in settings modal"
```

---

### Task 3: Criar componente TransferenciaApoioModal

**Files:**
- Create: `components/movimentos/TransferenciaApoioModal.vue`

**Step 1: Criar o componente completo**

O componente recebe via props:
- `modelValue` (boolean) — controla visibilidade
- `itensEntrada` (array) — lista de `{ produto_id, quantidade, produto_nome, unidade_sigla }` que foram registrados

Internamente:
- Ao abrir, busca `getSaldoProduto()` para cada produto
- Lista cada produto com checkbox + input de quantidade
- Valida: quantidade > 0, quantidade <= saldo principal
- Ao confirmar, cria saídas tipo `transferencia` para cada selecionado
- Mostra tela de resumo com o que foi transferido

```vue
<template>
  <UModal
    :model-value="modelValue"
    :prevent-close="salvando"
    :ui="{
      width: 'sm:max-w-xl',
      overlay: { background: 'bg-operacao-900/50 backdrop-blur-sm' },
      background: 'bg-white dark:bg-operacao-800',
      ring: 'ring-1 ring-operacao-200 dark:ring-operacao-700',
      shadow: 'shadow-2xl'
    }"
    @close="fechar"
  >
    <UCard :ui="{ background: 'bg-transparent', ring: 'ring-0', shadow: '', divide: 'divide-operacao-100 dark:divide-operacao-700' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg flex items-center justify-center" :class="etapa === 'resumo' ? 'bg-green-100' : 'bg-blue-100'">
              <UIcon
                :name="etapa === 'resumo' ? 'i-heroicons-check-circle' : 'i-heroicons-arrow-path-rounded-square'"
                class="w-5 h-5"
                :class="etapa === 'resumo' ? 'text-green-600' : 'text-blue-600'"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-operacao-800">
                {{ etapa === 'resumo' ? 'Transferência Concluída' : 'Enviar para Estoque de Apoio?' }}
              </h3>
              <p v-if="etapa === 'selecao'" class="text-xs text-operacao-400">
                Selecione os produtos para transferir ao estoque de apoio
              </p>
            </div>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark"
            @click="fechar"
          />
        </div>
      </template>

      <!-- Etapa: Seleção -->
      <div v-if="etapa === 'selecao'" class="space-y-3">
        <div v-if="carregandoSaldos" class="flex items-center justify-center py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 text-operacao-400 animate-spin mr-2" />
          <span class="text-sm text-operacao-400">Carregando saldos...</span>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(item, idx) in itensModal"
            :key="item.produto_id"
            class="flex items-center gap-3 p-3 rounded-xl border transition-colors"
            :class="item.selecionado ? 'border-blue-200 bg-blue-50/50' : 'border-operacao-100 bg-operacao-50/50'"
          >
            <input
              type="checkbox"
              v-model="item.selecionado"
              class="w-4 h-4 rounded border-operacao-300 text-blue-600 focus:ring-blue-500"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
              <p class="text-xs text-operacao-400">
                Entrou: {{ item.qtd_entrada }} {{ item.unidade_sigla }} · Saldo principal: {{ item.saldo_principal }} {{ item.unidade_sigla }}
              </p>
            </div>
            <div class="w-24 flex-shrink-0">
              <UInput
                v-model.number="item.quantidade"
                type="number"
                size="sm"
                placeholder="Qtd"
                :min="0"
                :max="item.saldo_principal"
                :disabled="!item.selecionado"
              />
              <p v-if="item.selecionado && item.quantidade > item.saldo_principal" class="text-[10px] text-red-500 mt-0.5">
                Máx: {{ item.saldo_principal }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Etapa: Resumo -->
      <div v-else-if="etapa === 'resumo'" class="space-y-3">
        <div
          v-for="item in itensTransferidos"
          :key="item.produto_id"
          class="flex items-center gap-3 p-3 rounded-xl bg-green-50/50 border border-green-200"
        >
          <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-operacao-800 truncate">{{ item.produto_nome }}</p>
          </div>
          <p class="text-sm font-semibold text-green-700 flex-shrink-0">
            {{ item.quantidade }} {{ item.unidade_sigla }} → Apoio
          </p>
        </div>
        <p class="text-xs text-operacao-400 text-center pt-1">
          {{ itensTransferidos.length }} produto{{ itensTransferidos.length > 1 ? 's' : '' }} transferido{{ itensTransferidos.length > 1 ? 's' : '' }} ao estoque de apoio
        </p>
      </div>

      <template #footer>
        <div v-if="etapa === 'selecao'" class="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <UButton color="gray" variant="ghost" class="w-full sm:w-auto" @click="fechar">
            Não enviar nada
          </UButton>
          <UButton
            color="blue"
            class="w-full sm:w-auto"
            :loading="salvando"
            :disabled="!temItensSelecionados"
            @click="confirmarTransferencia"
          >
            <UIcon name="i-heroicons-arrow-path-rounded-square" class="w-4 h-4 mr-1.5" />
            Confirmar Transferência
          </UButton>
        </div>
        <div v-else class="flex justify-end">
          <UButton color="gray" variant="soft" class="w-full sm:w-auto" @click="fechar">
            Fechar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup lang="ts">
interface ItemEntradaInfo {
  produto_id: string
  quantidade: number
  produto_nome: string
  unidade_sigla: string
}

interface ItemModal {
  produto_id: string
  produto_nome: string
  unidade_sigla: string
  qtd_entrada: number
  saldo_principal: number
  selecionado: boolean
  quantidade: number
}

const props = defineProps<{
  modelValue: boolean
  itensEntrada: ItemEntradaInfo[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { createSaida, getSaldoProduto } = useEstoque()
const toast = useToast()

const etapa = ref<'selecao' | 'resumo'>('selecao')
const carregandoSaldos = ref(false)
const salvando = ref(false)
const itensModal = ref<ItemModal[]>([])
const itensTransferidos = ref<ItemModal[]>([])

const temItensSelecionados = computed(() =>
  itensModal.value.some(i => i.selecionado && i.quantidade > 0 && i.quantidade <= i.saldo_principal)
)

watch(() => props.modelValue, async (aberto) => {
  if (aberto) {
    etapa.value = 'selecao'
    itensTransferidos.value = []
    await carregarSaldos()
  }
})

const carregarSaldos = async () => {
  carregandoSaldos.value = true
  try {
    itensModal.value = await Promise.all(
      props.itensEntrada.map(async (item) => {
        const saldo = await getSaldoProduto(item.produto_id)
        return {
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          unidade_sigla: item.unidade_sigla,
          qtd_entrada: item.quantidade,
          saldo_principal: saldo,
          selecionado: false,
          quantidade: 0
        }
      })
    )
  } catch (error) {
    console.error('Erro ao carregar saldos:', error)
  } finally {
    carregandoSaldos.value = false
  }
}

const confirmarTransferencia = async () => {
  const selecionados = itensModal.value.filter(
    i => i.selecionado && i.quantidade > 0 && i.quantidade <= i.saldo_principal
  )
  if (selecionados.length === 0) return

  salvando.value = true
  try {
    const hoje = new Date().toISOString().split('T')[0]
    for (const item of selecionados) {
      await createSaida({
        produto_id: item.produto_id,
        tipo: 'transferencia' as const,
        data: hoje,
        quantidade: item.quantidade,
        observacao: 'Transferência automática pós-entrada'
      })
    }
    itensTransferidos.value = selecionados
    etapa.value = 'resumo'
  } catch (error: any) {
    toast.add({
      title: 'Erro',
      description: error.message || 'Erro ao transferir produtos',
      color: 'red'
    })
  } finally {
    salvando.value = false
  }
}

const fechar = () => {
  emit('update:modelValue', false)
}
</script>
```

**Step 2: Commit**

```bash
git add components/movimentos/TransferenciaApoioModal.vue
git commit -m "feat: create TransferenciaApoioModal component"
```

---

### Task 4: Integrar modal na página de Entradas

**Files:**
- Modify: `pages/movimentos/entradas.vue`

**Step 1: Adicionar estado e template do modal**

No template, após os modais existentes (final do template), adicionar:

```html
<!-- Modal: Transferência para Apoio -->
<TransferenciaApoioModal
  v-model="transferenciaApoioOpen"
  :itens-entrada="itensParaApoio"
/>
```

No script, adicionar refs:

```typescript
const transferenciaApoioOpen = ref(false)
const itensParaApoio = ref<Array<{ produto_id: string; quantidade: number; produto_nome: string; unidade_sigla: string }>>([])
```

Importar `useEmpresa` para acessar `empresaAtiva`:

```typescript
const { empresaId, empresaAtiva } = useEmpresa()
```

(Nota: `empresaId` já é importado na linha 623, basta adicionar `empresaAtiva`)

**Step 2: Modificar `saveEntrada` para abrir o modal após criação**

Na função `saveEntrada`, no bloco de criação (não edição), após o loop de `createEntrada` e antes de `modalOpen.value = false`, montar a lista de itens e abrir o modal:

Substituir o trecho (linhas ~880-904):

```typescript
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
    }

    modalOpen.value = false
    await loadEntradas()
    page.value = 1
```

Por:

```typescript
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

      // Sugerir transferência para apoio (se habilitado)
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

    modalOpen.value = false
    await loadEntradas()
    page.value = 1

    // Abrir modal de apoio após fechar o de entrada
    if (itensParaApoio.value.length > 0) {
      transferenciaApoioOpen.value = true
    }
```

**Step 3: Commit**

```bash
git add pages/movimentos/entradas.vue
git commit -m "feat: integrate TransferenciaApoioModal into entradas page"
```

---

### Task 5: Testar o fluxo completo manualmente

**Checklist de verificação:**

1. [ ] Criar uma entrada com 2+ produtos → modal de apoio abre
2. [ ] Selecionar 1 produto, digitar quantidade válida → confirmar funciona
3. [ ] Tela de resumo mostra os itens transferidos corretamente
4. [ ] Clicar "Não enviar nada" → fecha sem criar saídas
5. [ ] Editar uma entrada existente → modal de apoio NÃO abre
6. [ ] Desativar toggle nas Configurações → modal de apoio NÃO abre após entrada
7. [ ] Reativar toggle → modal volta a funcionar
8. [ ] Digitar quantidade maior que saldo → mostra erro
9. [ ] Checkbox desmarcado com quantidade → produto é ignorado

**Step 1: Commit final**

```bash
git add -A
git commit -m "feat: complete transferencia apoio pos-entrada feature"
```
