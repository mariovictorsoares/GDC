# Versionamento de Fichas Tecnicas

## Problema

Editar uma ficha tecnica modifica o registro in-place sem incrementar a versao. O usuario perde o historico de ingredientes/quantidades anteriores.

## Solucao

Cada edicao cria um **novo registro** com versao incrementada. O registro antigo fica `ativa = false` com seus ingredientes intactos.

## Banco de Dados

### Nova coluna + indice

```sql
ALTER TABLE fichas_tecnicas ADD COLUMN IF NOT EXISTS ficha_base_id UUID;
UPDATE fichas_tecnicas SET ficha_base_id = id WHERE ficha_base_id IS NULL;
ALTER TABLE fichas_tecnicas ALTER COLUMN ficha_base_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ft_ficha_base ON fichas_tecnicas(ficha_base_id);
```

`ficha_base_id` agrupa todas as versoes de uma mesma receita:
- v1: `ficha_base_id = id` (aponta pra si mesmo)
- v2+: `ficha_base_id` copiado do pai

Nenhuma tabela nova. Sem FK auto-referencial (para evitar complicacoes com delecao).

### Constraints existentes que ja funcionam

- `UNIQUE(empresa_id, produto_id, versao)` — impede versoes duplicadas
- `UNIQUE INDEX ... WHERE ativa = true` — garante uma unica versao ativa por produto

### RLS

Sem mudancas. As policies existentes usam `empresa_id` que e compartilhado entre todas as versoes.

## Fluxo de Criacao

1. Gerar UUID no client
2. Inserir com `id = uuid`, `ficha_base_id = uuid`, `versao = 1`, `ativa = true`
3. Inserir ingredientes normalmente

Sem mudanca conceitual.

## Fluxo de Edicao (muda)

Antes: UPDATE in-place + deleta/recria ingredientes.

Agora: **operacao atomica via RPC** (Postgres function) para evitar estado inconsistente:

```sql
CREATE OR REPLACE FUNCTION criar_nova_versao_ficha(
  p_ficha_id UUID,
  p_nova_id UUID,
  p_nome TEXT,
  p_rendimento DECIMAL,
  p_observacao TEXT,
  p_ingredientes JSONB
) RETURNS fichas_tecnicas AS $$
DECLARE
  v_ficha fichas_tecnicas;
  v_nova fichas_tecnicas;
  v_max_versao INTEGER;
BEGIN
  -- Buscar ficha atual
  SELECT * INTO v_ficha FROM fichas_tecnicas WHERE id = p_ficha_id AND ativa = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ficha tecnica nao encontrada ou inativa';
  END IF;

  -- Pegar versao maxima (protege contra edicao simultanea)
  SELECT COALESCE(MAX(versao), 0) INTO v_max_versao
  FROM fichas_tecnicas
  WHERE ficha_base_id = v_ficha.ficha_base_id;

  -- Desativar versao atual
  UPDATE fichas_tecnicas SET ativa = false WHERE id = p_ficha_id;

  -- Criar nova versao
  INSERT INTO fichas_tecnicas (id, empresa_id, produto_id, nome, rendimento, versao, ativa, observacao, ficha_base_id)
  VALUES (
    p_nova_id,
    v_ficha.empresa_id,
    v_ficha.produto_id,
    p_nome,
    p_rendimento,
    v_max_versao + 1,
    true,
    p_observacao,
    v_ficha.ficha_base_id
  )
  RETURNING * INTO v_nova;

  -- Inserir ingredientes
  INSERT INTO ficha_tecnica_ingredientes (ficha_tecnica_id, produto_id, quantidade, fator_correcao, observacao)
  SELECT p_nova_id, (ing->>'produto_id')::UUID, (ing->>'quantidade')::DECIMAL, COALESCE((ing->>'fator_correcao')::DECIMAL, 1), ing->>'observacao'
  FROM jsonb_array_elements(p_ingredientes) AS ing;

  RETURN v_nova;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Pontos-chave:
- Tudo numa transacao — se algo falha, nada muda
- Usa `MAX(versao) + 1` em vez de confiar no client (protege contra edicao simultanea)
- `produto_id` vem da ficha existente, nao do client (restricao de produto)

### Restricao

Produto (`produto_id`) nao pode ser alterado no edit. O form desabilita o seletor de produto em modo edicao. Se precisar mudar o produto, criar uma ficha nova.

## Delecao

- **Deletar ficha ativa**: deleta todas as versoes com o mesmo `ficha_base_id`
  - Se alguma versao tem OP vinculada (`ordens_producao.ficha_tecnica_id`), a delecao e **bloqueada** com erro amigavel ("Esta ficha possui ordens de producao vinculadas")
  - Verificar existencia de OPs antes de tentar deletar
- **Versoes inativas**: nunca sao deletadas individualmente — fazem parte do historico

## UI: Historico de Versoes

Na tela de fichas tecnicas, ao interagir com uma ficha, mostrar painel/modal com:
- Lista das versoes (v3, v2, v1) com `created_at` de cada versao
- Clicar numa versao expande e mostra ingredientes em modo read-only
- Versao ativa marcada visualmente
- Query inclui join com `ficha_tecnica_ingredientes` e `produtos` para exibir nomes

## Impacto em Queries Existentes

| Query | Impacto |
|-------|---------|
| Lista de fichas (`ativa = true`) | Nenhum — funciona igual |
| OPs (`ficha_tecnica_id` FK) | Nenhum — FK aponta pro registro exato da versao usada |
| Criar OP | Continua passando o `id` da versao ativa (nao o `ficha_base_id`) |
| `ficha_versao` na OP | Ja funciona — campo existente em `ordens_producao` captura a versao |
| Nova: historico | `SELECT *, ingredientes FROM fichas_tecnicas WHERE ficha_base_id = ? ORDER BY versao DESC` |

## Arquivos Afetados

- `supabase/migrations/` — nova migration: coluna `ficha_base_id`, indice, funcao RPC
- `composables/useProducao.ts` — `createFichaTecnica` (gerar UUID + ficha_base_id), `updateFichaTecnica` (chamar RPC), novo `getHistoricoFicha`
- `components/producao/FichaTecnicaForm.vue` — desabilitar produto no edit, salvar via RPC
- `pages/producao/fichas-tecnicas.vue` — botao/UI de historico, verificacao antes de deletar
- `types/index.ts` — adicionar `ficha_base_id` ao tipo `FichaTecnica`
