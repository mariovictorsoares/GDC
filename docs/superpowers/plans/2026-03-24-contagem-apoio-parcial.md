# Contagem de Apoio Parcial - Seleção de Setores

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que o usuário selecione quais setores de apoio incluir na contagem, ao invés de obrigar a contar todos.

**Architecture:** Adicionar seleção de setores ao slideover de configuração da contagem (somente para tipo "apoio"). Atualizar `updateContagem` para aceitar setores explícitos. Adicionar validação no gerenciador de setores para impedir produto duplicado em múltiplos setores de apoio (garantir ajuste correto).

**Tech Stack:** Vue 3 + Nuxt 3, Supabase (PostgreSQL), Tailwind CSS

---

## Regras de Negócio

1. **Somente apoio** tem seleção parcial de setores. Principal e inventário mantêm comportamento atual (todos os setores auto-incluídos).
2. **Um produto só pode pertencer a um setor de apoio** — garante que o ajuste de estoque seja correto ao fazer contagem parcial.
3. Produtos em setores do tipo "principal" não têm essa restrição (principal sempre conta tudo).

## Arquivos Afetados

| Arquivo | Ação | Responsabilidade |
|---------|------|-----------------|
| `composables/useEstoque.ts` | Modificar | `updateContagem`: aceitar `setorIds` opcional |
| `pages/movimentos/contagens.vue` | Modificar | Adicionar UI de seleção de setores ao slideover (apoio only) |
| `components/contagem/SetorGerenciarModal.vue` | Modificar | Validação: produto único por tipo de setor apoio |

---

### Task 1: updateContagem — aceitar setorIds explícitos

**Files:**
- Modify: `composables/useEstoque.ts:1326-1387`

- [ ] **Step 1: Adicionar 3º parâmetro `setorIds?: string[]` à função**

Na função `updateContagem` (linha 1326), adicionar o terceiro parâmetro opcional:

```typescript
const updateContagem = async (
  id: string,
  contagem: {
    nome?: string
    recorrencia?: string
    horario_notificacao?: string
    dias_semana?: string[]
    mensal_posicao?: string
    mensal_dia?: string
    responsavel_nome?: string
    responsavel_telefone?: string
    responsavel_id?: string
    responsaveis_data?: Array<{ id?: string; nome: string; telefone: string }>
  },
  setorIds?: string[]
) => {
```

- [ ] **Step 2: Usar setorIds quando fornecido, senão manter auto-query**

Substituir o bloco de re-sincronização de setores (linhas 1364-1386) por:

```typescript
// Re-sincronizar setores apenas se a contagem não está em andamento
if (contagemAtual?.status !== 'em_andamento') {
  let setorIdsFinais: string[]

  if (setorIds) {
    // Setores explícitos (ex: apoio com seleção parcial)
    setorIdsFinais = setorIds
  } else {
    // Auto-query por tipo (comportamento padrão para principal/inventário)
    const setorQuery = client
      .from('setores')
      .select('id')
      .eq('empresa_id', empresaId.value)

    if (contagemAtual?.tipo !== 'inventario') {
      setorQuery.eq('tipo', contagemAtual?.tipo)
    }

    const { data: setoresAuto } = await setorQuery
    setorIdsFinais = (setoresAuto || []).map((s: any) => s.id)
  }

  await client.from('contagem_setores').delete().eq('contagem_id', id)
  if (setorIdsFinais.length > 0) {
    const rows = setorIdsFinais.map((sid: string) => ({ contagem_id: id, setor_id: sid }))
    const { error: errSetores } = await client
      .from('contagem_setores')
      .insert(rows)
    if (errSetores) throw errSetores
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add composables/useEstoque.ts
git commit -m "feat(contagem): accept optional setorIds in updateContagem"
```

---

### Task 2: Adicionar seleção de setores ao slideover (apoio only)

**Files:**
- Modify: `pages/movimentos/contagens.vue`

- [ ] **Step 1: Adicionar state para setores selecionados**

Após a linha 430 (`const setupMensalDia`), adicionar:

```typescript
const setupSetoresSelecionados = ref<Set<string>>(new Set())
```

- [ ] **Step 2: Adicionar computed para setores de apoio disponíveis**

Junto aos outros computed (perto da linha 660), adicionar:

```typescript
const setoresApoioDisponiveis = computed(() => {
  return setores.value.filter(s => s.tipo === 'apoio')
})
```

- [ ] **Step 3: Adicionar computed para verificar se contagem sendo editada é tipo apoio**

```typescript
const configurandoEhApoio = computed(() => {
  if (!editandoContagemId.value) return false
  const c = contagensPersistidas.value.find(ct => ct.id === editandoContagemId.value)
  return c?.tipo === 'apoio'
})
```

- [ ] **Step 4: Inicializar setores selecionados em `abrirConfigurar`**

No final da função `abrirConfigurar` (antes de `slideoverSetupOpen.value = true` na linha 1013), adicionar:

```typescript
// Inicializar setores selecionados a partir dos contagem_setores existentes
const idsExistentes = (contagem.contagem_setores || []).map(cs => cs.setor_id)
if (idsExistentes.length === 0 && contagem.tipo === 'apoio') {
  // Primeira configuração: pré-selecionar todos os setores de apoio
  const apoioIds = setores.value.filter(s => s.tipo === 'apoio').map(s => s.id)
  setupSetoresSelecionados.value = new Set(apoioIds)
} else {
  setupSetoresSelecionados.value = new Set(idsExistentes)
}
```

- [ ] **Step 5: Adicionar UI de seleção de setores no template do slideover**

No template do slideover, ANTES do bloco de info de setores (linha 311), adicionar a seção de seleção condicional para apoio. Substituir o bloco de info read-only (linhas 310-317):

```html
<!-- Seleção de setores (apenas apoio) -->
<template v-if="configurandoEhApoio">
  <div class="border-t border-operacao-200" />
  <div>
    <h4 class="font-semibold text-operacao-800 mb-1">Selecionar Setores</h4>
    <p class="text-sm text-operacao-400 mb-3">Escolha quais setores de apoio serão incluídos nesta contagem.</p>

    <div v-if="setoresApoioDisponiveis.length === 0" class="text-center py-4 text-operacao-400">
      <UIcon name="i-heroicons-map-pin" class="w-6 h-6 mb-1 mx-auto" />
      <p class="text-sm">Nenhum setor de apoio cadastrado</p>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="setor in setoresApoioDisponiveis"
        :key="setor.id"
        class="flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer"
        :class="setupSetoresSelecionados.has(setor.id)
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-operacao-200 bg-white hover:border-operacao-300'"
        @click="toggleSetorSetup(setor.id)"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
            :class="setupSetoresSelecionados.has(setor.id)
              ? 'border-emerald-500 bg-emerald-500'
              : 'border-operacao-300 bg-white'"
          >
            <UIcon
              v-if="setupSetoresSelecionados.has(setor.id)"
              name="i-heroicons-check"
              class="w-3.5 h-3.5 text-white"
            />
          </div>
          <div>
            <p class="font-medium text-operacao-800 text-sm">{{ setor.nome }}</p>
            <p class="text-xs text-operacao-400">{{ setorProdutosCount[setor.id] || 0 }} {{ (setorProdutosCount[setor.id] || 0) === 1 ? 'produto' : 'produtos' }}</p>
          </div>
        </div>
      </div>
    </div>

    <p v-if="setupSetoresSelecionados.size > 0" class="text-xs text-operacao-400 mt-2">
      {{ setupSetoresSelecionados.size }} {{ setupSetoresSelecionados.size === 1 ? 'setor selecionado' : 'setores selecionados' }}
    </p>
  </div>
</template>

<!-- Info: setores que serão contados (principal/inventário - read-only) -->
<div v-else-if="setoresDoTipoSelecionado.length > 0" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-operacao-50 border border-operacao-200 text-sm text-operacao-500">
  <UIcon name="i-heroicons-information-circle" class="w-4 h-4 flex-shrink-0 text-operacao-400" />
  <span>
    <span class="font-medium text-operacao-700">{{ setoresDoTipoSelecionado.length }} {{ setoresDoTipoSelecionado.length === 1 ? 'setor' : 'setores' }}</span>
    serão contados: {{ setoresDoTipoSelecionado.map(s => s.nome).join(', ') }}
  </span>
</div>
```

- [ ] **Step 6: Adicionar método toggleSetorSetup**

Junto aos outros métodos de setup (perto da linha 935):

```typescript
const toggleSetorSetup = (setorId: string) => {
  const novo = new Set(setupSetoresSelecionados.value)
  if (novo.has(setorId)) {
    novo.delete(setorId)
  } else {
    novo.add(setorId)
  }
  setupSetoresSelecionados.value = novo
}
```

- [ ] **Step 7: Atualizar validação do botão Salvar**

Na linha 325, o botão Salvar tem `:disabled="!setupRecorrencia || setupResponsaveis.length === 0"`. Adicionar validação para apoio precisar de pelo menos 1 setor:

```html
:disabled="!setupRecorrencia || setupResponsaveis.length === 0 || (configurandoEhApoio && setupSetoresSelecionados.size === 0)"
```

- [ ] **Step 8: Atualizar `salvarContagem` para passar setorIds para apoio**

Na função `salvarContagem` (linha 1016), modificar a chamada de `updateContagem` para passar o 3º parâmetro quando for apoio:

```typescript
const salvarContagem = async () => {
  if (!editandoContagemId.value || !setupRecorrencia.value || setupResponsaveis.value.length === 0) return
  try {
    loadingSetup.value = true
    const diasSemanaArr = Array.from(setupDiasSemana.value)
    const primeiro = setupResponsaveis.value[0]

    // Para apoio: passar setores selecionados explicitamente
    // Para principal/inventário: não passar (auto-query por tipo)
    const setorIdsParam = configurandoEhApoio.value
      ? Array.from(setupSetoresSelecionados.value)
      : undefined

    await updateContagem(
      editandoContagemId.value,
      {
        recorrencia: setupRecorrencia.value,
        horario_notificacao: setupHorarioNotificacao.value,
        dias_semana: diasSemanaArr.length > 0 ? diasSemanaArr : undefined,
        mensal_posicao: setupRecorrencia.value === 'mensal' ? setupMensalPosicao.value : undefined,
        mensal_dia: setupRecorrencia.value === 'mensal' ? setupMensalDia.value : undefined,
        responsavel_nome: primeiro.nome,
        responsavel_telefone: primeiro.telefone,
        responsavel_id: (primeiro as any).id || undefined,
        responsaveis_data: setupResponsaveis.value.map(r => ({ id: r.id, nome: r.nome, telefone: r.telefone }))
      },
      setorIdsParam
    )
    slideoverSetupOpen.value = false
    toast.add({ title: 'Sucesso', description: 'Contagem configurada com sucesso', color: 'green' })
    await carregarContagens()
    if (contagemSelecionada.value?.id === editandoContagemId.value) {
      const atualizada = contagensPersistidas.value.find(c => c.id === editandoContagemId.value)
      if (atualizada) contagemSelecionada.value = atualizada
    }
    editandoContagemId.value = null
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao salvar contagem', color: 'red' })
  } finally {
    loadingSetup.value = false
  }
}
```

- [ ] **Step 9: Commit**

```bash
git add pages/movimentos/contagens.vue
git commit -m "feat(contagem): add setor selection UI for apoio partial counting"
```

---

### Task 3: Validação — produto único por setor de apoio

**Files:**
- Modify: `components/contagem/SetorGerenciarModal.vue`

- [ ] **Step 1: Adicionar state para mapear produtos já vinculados em outros setores de apoio**

Após a linha 281, adicionar:

```typescript
// Mapa: produto_id → setor nome (para setores de apoio, excluindo o setor atual)
const produtosEmOutrosSetoresApoio = ref<Map<string, string>>(new Map())
```

- [ ] **Step 2: Carregar produtos de outros setores apoio ao selecionar um setor**

Importar `getAllSetorProdutos` no destructuring (linha 265):

```typescript
const { createSetor, deleteSetor, getSetorProdutos, addProdutosToSetor, removeProdutoFromSetor, getAllSetorProdutos } = useEstoque()
```

Modificar o método `selecionarSetor` (linha 319) para também carregar este mapa:

```typescript
const selecionarSetor = async (setor: Setor) => {
  setorSelecionado.value = setor
  buscaProdutoSetor.value = ''
  filtroGrupoSetor.value = ''
  filtroSubgrupoSetor.value = ''
  try {
    loadingSetorProdutos.value = true
    setorProdutosLista.value = await getSetorProdutos(setor.id)

    // Se setor é apoio, carregar mapa de produtos em outros setores apoio
    if (setor.tipo === 'apoio') {
      const allSP = await getAllSetorProdutos()
      const setoresApoioIds = new Set(
        props.setores.filter(s => s.tipo === 'apoio' && s.id !== setor.id).map(s => s.id)
      )
      const mapa = new Map<string, string>()
      for (const sp of allSP) {
        if (setoresApoioIds.has(sp.setor_id)) {
          const nomeSetor = props.setores.find(s => s.id === sp.setor_id)?.nome || 'Outro setor'
          mapa.set(sp.produto_id, nomeSetor)
        }
      }
      produtosEmOutrosSetoresApoio.value = mapa
    } else {
      produtosEmOutrosSetoresApoio.value = new Map()
    }
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao carregar produtos do setor', color: 'red' })
  } finally {
    loadingSetorProdutos.value = false
  }
}
```

- [ ] **Step 3: Adicionar validação em `adicionarProdutoAoSetor`**

Substituir o método (linhas 384-395):

```typescript
const adicionarProdutoAoSetor = async (produtoId: string) => {
  if (!setorSelecionado.value) return

  // Validação: produto único por setor de apoio
  if (setorSelecionado.value.tipo === 'apoio') {
    const setorConflitante = produtosEmOutrosSetoresApoio.value.get(produtoId)
    if (setorConflitante) {
      const produto = props.produtos.find(p => p.id === produtoId)
      toast.add({
        title: 'Produto já vinculado',
        description: `"${produto?.nome}" já está no setor "${setorConflitante}". Remova de lá primeiro.`,
        color: 'amber',
        timeout: 5000
      })
      return
    }
  }

  try {
    adicionandoProdutos.value = true
    const novos = await addProdutosToSetor(setorSelecionado.value.id, [produtoId])
    setorProdutosLista.value.push(...novos)
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao vincular produto', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}
```

- [ ] **Step 4: Adicionar validação em `adicionarTodosVisiveis`**

Substituir o método (linhas 397-410):

```typescript
const adicionarTodosVisiveis = async () => {
  if (!setorSelecionado.value || produtosDisponiveis.value.length === 0) return
  try {
    adicionandoProdutos.value = true
    let ids = produtosDisponiveis.value.map(p => p.id)

    // Filtrar produtos conflitantes para setores de apoio
    if (setorSelecionado.value.tipo === 'apoio') {
      const conflitantes = ids.filter(id => produtosEmOutrosSetoresApoio.value.has(id))
      if (conflitantes.length > 0) {
        ids = ids.filter(id => !produtosEmOutrosSetoresApoio.value.has(id))
        toast.add({
          title: 'Alguns produtos ignorados',
          description: `${conflitantes.length} produto(s) já vinculado(s) a outros setores de apoio foram ignorados.`,
          color: 'amber',
          timeout: 5000
        })
      }
      if (ids.length === 0) return
    }

    const novos = await addProdutosToSetor(setorSelecionado.value.id, ids)
    setorProdutosLista.value.push(...novos)
    toast.add({ title: 'Sucesso', description: `${novos.length} produtos adicionados`, color: 'green' })
  } catch (error: any) {
    toast.add({ title: 'Erro', description: error.message || 'Erro ao vincular produtos', color: 'red' })
  } finally {
    adicionandoProdutos.value = false
  }
}
```

- [ ] **Step 5: Filtrar produtos conflitantes da lista de disponíveis (visual)**

Modificar o computed `produtosDisponiveis` (linha 292) para marcar/indicar produtos que estão em outros setores apoio. Adicionar indicador visual no template.

No template da coluna esquerda (linha 154), adicionar badge de conflito:

```html
<div
  v-for="prod in produtosDisponiveis.slice(0, 100)"
  :key="prod.id"
  class="flex items-center justify-between px-4 py-2 transition-colors group"
  :class="setorSelecionado?.tipo === 'apoio' && produtosEmOutrosSetoresApoio.has(prod.id)
    ? 'bg-amber-50/50 cursor-not-allowed'
    : 'hover:bg-controle-50 cursor-pointer'"
  @click="adicionarProdutoAoSetor(prod.id)"
>
  <div class="flex-1 min-w-0">
    <p class="text-sm text-operacao-600 truncate">{{ prod.nome }}</p>
    <p class="text-xs text-operacao-400 truncate">{{ prod.subgrupo?.grupo?.nome }} / {{ prod.subgrupo?.nome }}</p>
    <p v-if="setorSelecionado?.tipo === 'apoio' && produtosEmOutrosSetoresApoio.has(prod.id)" class="text-[10px] text-amber-600 mt-0.5">
      Já em: {{ produtosEmOutrosSetoresApoio.get(prod.id) }}
    </p>
  </div>
  <UIcon
    v-if="!(setorSelecionado?.tipo === 'apoio' && produtosEmOutrosSetoresApoio.has(prod.id))"
    name="i-heroicons-plus-circle"
    class="w-5 h-5 text-operacao-300 group-hover:text-controle-500 transition-colors flex-shrink-0 ml-2"
  />
  <UIcon
    v-else
    name="i-heroicons-exclamation-triangle"
    class="w-4 h-4 text-amber-400 flex-shrink-0 ml-2"
  />
</div>
```

- [ ] **Step 6: Commit**

```bash
git add components/contagem/SetorGerenciarModal.vue
git commit -m "feat(contagem): validate unique product per apoio sector"
```

---

### Task 4: Limpar — remover ContagemEditarModal não utilizado (opcional)

**Files:**
- Verify: `components/contagem/ContagemEditarModal.vue`

- [ ] **Step 1: Verificar se ContagemEditarModal é importado em algum lugar**

Se não for usado em nenhuma página ou componente (apenas referenciado em docs/plans antigos), pode ser removido para evitar confusão. Se for usado, deixar como está.

- [ ] **Step 2: Commit (se aplicável)**

```bash
git rm components/contagem/ContagemEditarModal.vue
git commit -m "chore: remove unused ContagemEditarModal component"
```
