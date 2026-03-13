# Melhorias na Página Pública de Contagem

**Data**: 2026-03-13
**Arquivo principal**: `pages/contagem/[token].vue`

## Contexto

A página pública de contagem (`/contagem/[token]`) é usada pelo responsável via link (WhatsApp) para contar produtos por setor. Três problemas identificados:

1. **Tabs de setor cortando** — botões horizontais com overflow cortam nomes
2. **Quantidades transferindo entre setores** — o estado `quantidades` é flat por `produto_id`, sem separação por setor
3. **Sem revisão nem trava** — salvar é instantâneo sem confirmação, setores salvos podem ser editados

## Mudanças

### 1. Quantidades por setor (bug fix)

**Estado atual**: `quantidades: Record<string, number | null>` — chave: `produto_id`
**Novo estado**: `quantidades: Record<string, Record<string, number | null>>` — chave: `setor_id` → `produto_id`

No carregamento (`carregarDados`), iterar `res.setores` e popular por setor:
```typescript
for (const setor of res.setores) {
  quantidades.value[setor.id] = {}
  for (const p of setor.produtos) {
    if (p.quantidade_contada !== null && p.quantidade_contada !== undefined) {
      quantidades.value[setor.id][p.id] = p.quantidade_contada
    }
  }
}
```

**Todos os pontos que acessam `quantidades` devem usar a chave composta `[setorAtivo][produtoId]`:**
- Template: `:value="quantidades[setorAtivo]?.[produto.id]"` e `:class` condition
- `onQuantidadeInput(produtoId, event)` → escreve em `quantidades.value[setorAtivo.value][produtoId]`
- `incrementar(produtoId)` → lê/escreve em `quantidades.value[setorAtivo.value][produtoId]`
- `decrementar(produtoId)` → lê/escreve em `quantidades.value[setorAtivo.value][produtoId]`
- `preenchidosSetorAtual` computed → itera `quantidades.value[setorAtivo.value]`
- **`salvarSetor` payload builder** → `quantidades.value[setorAtivo.value][p.id]` (não o flat antigo)

### 2. Dropdown de setor (substituir tabs)

Substituir os botões horizontais (linhas 62-88) por um `<select>` nativo:
- Cada opção: nome do setor + status (prefixo "✓" se finalizado)
- Posição sticky abaixo do header
- Funciona melhor no mobile, resolve o problema de corte

**Ao trocar de setor no dropdown:**
- Resetar `modoRevisao = false`
- Resetar `busca = ''`
- Scroll para o topo

### 3. Todos os produtos obrigatórios

O botão "Salvar" no footer só habilita quando **todos** os produtos do setor atual têm quantidade preenchida (incluindo 0, ou seja, `!= null && !== ''`).

Texto do botão:
- Incompleto: "X de Y contados" — botão desabilitado
- Completo: "Revisar e Salvar" — botão habilitado

Se a API retornar `saved: 0`, mostrar toast de erro.

### 4. Tela de resumo pré-salvar

Novo estado: `modoRevisao = ref(false)`

Quando o usuário clica "Revisar e Salvar":
- `modoRevisao = true`, scroll para o topo
- Template mostra lista completa dos produtos do setor com nome, unidade e quantidade (texto, sem inputs)
- **Busca escondida** durante modo revisão (lista completa sempre visível)
- Layout: lista vertical simples, cada item mostra "Produto — X UN"
- Botões: "Confirmar" (POST API, trava setor) e "Voltar para editar" (volta ao modo edição)

Ao clicar "Confirmar":
1. POST `/api/contagem/[token]` com `{setor_id, itens}`
2. Se `saved: 0`, mostrar toast de erro e retornar
3. Atualizar estado local: `setorAtual.progresso = res.progresso` **E** `setorAtual.status = 'finalizado'`
4. Resetar `modoRevisao = false`
5. Auto-selecionar próximo setor incompleto no dropdown
6. Se todos finalizados (`res.contagemCompleta`), mostrar tela de conclusão

### 5. Travar setores salvos (somente leitura)

Condição de trava: **`status === 'finalizado'`** (fonte única de verdade do servidor).

Quando o setor selecionado tem `status === 'finalizado'`:
- No dropdown: prefixo "✓" no nome
- Mostra mensagem no topo: "Este setor já foi salvo" com ícone de check
- Mostra os mesmos cards de produto mas sem input — apenas texto da quantidade (lido de `quantidades[setorId][produtoId]`)
- Sem botão "Salvar" no footer

### 6. Fluxo completo

```
1. Usuário abre link → GET /api/contagem/[token]
2. Carrega setores + produtos + quantidades já salvas (por setor)
3. Primeiro setor incompleto selecionado no dropdown
4. Preenche quantidades (todos obrigatórios, incluindo 0)
5. Botão "Revisar e Salvar" habilita ao atingir 100%
6. Clica → entra em modo revisão (lista read-only com todas quantidades)
7. "Confirmar" → POST /api/contagem/[token] {setor_id, itens}
8. Setor marcado como finalizado localmente (status + progresso) → travado
9. Auto-seleciona próximo setor incompleto no dropdown
10. Repete para cada setor
11. Último setor → tela "Contagem concluída!"
```

### 7. Escopo

- **Modificar**: `pages/contagem/[token].vue` (único arquivo)
- **Não modificar**: APIs (`[token].get.ts`, `[token].post.ts`) — já funcionam corretamente por setor
- **Não criar**: Nenhum arquivo novo necessário
