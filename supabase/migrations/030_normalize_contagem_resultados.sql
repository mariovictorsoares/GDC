-- =====================================================
-- MIGRATION 030: Normalizar contagens.resultados JSONB em tabelas
-- =====================================================
-- Problema: resultados acumulados em JSONB crescem infinitamente.
-- Cada finalizacao le o array inteiro, faz push, e reescreve tudo.
-- Solucao: tabelas normalizadas com indexes e RLS.
-- JSONB mantido como safety net (nao dropado).

-- 1. Criar tabelas
CREATE TABLE IF NOT EXISTS contagem_resultados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contagem_id UUID NOT NULL REFERENCES contagens(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  ciclo INTEGER NOT NULL,
  data DATE NOT NULL,
  finalizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  motivo TEXT,
  total_contados INTEGER NOT NULL DEFAULT 0,
  total_nao_contados INTEGER NOT NULL DEFAULT 0,
  total_sobras INTEGER NOT NULL DEFAULT 0,
  total_faltas INTEGER NOT NULL DEFAULT 0,
  valor_total_divergencia NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contagem_id, ciclo)
);

CREATE TABLE IF NOT EXISTS contagem_resultado_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  resultado_id UUID NOT NULL REFERENCES contagem_resultados(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  unidade_sigla TEXT,
  saldo_sistema NUMERIC NOT NULL DEFAULT 0,
  quantidade_contada NUMERIC NOT NULL DEFAULT 0,
  diferenca NUMERIC NOT NULL DEFAULT 0,
  custo_medio NUMERIC NOT NULL DEFAULT 0,
  valor_divergencia NUMERIC NOT NULL DEFAULT 0,
  setores_breakdown JSONB DEFAULT '[]'::jsonb,
  UNIQUE(resultado_id, produto_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_cr_contagem ON contagem_resultados(contagem_id);
CREATE INDEX IF NOT EXISTS idx_cr_empresa ON contagem_resultados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cr_finalizado ON contagem_resultados(finalizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_cri_resultado ON contagem_resultado_itens(resultado_id);
CREATE INDEX IF NOT EXISTS idx_cri_empresa ON contagem_resultado_itens(empresa_id);

-- 3. RLS
ALTER TABLE contagem_resultados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_empresa" ON contagem_resultados FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

ALTER TABLE contagem_resultado_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cri_empresa" ON contagem_resultado_itens FOR ALL
  USING (empresa_id IN (SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()));

-- 4. Migrar dados existentes do JSONB para as tabelas

-- 4a. Header rows (contagem_resultados)
INSERT INTO contagem_resultados (
  contagem_id, empresa_id, ciclo, data, finalizado_em, motivo,
  total_contados, total_nao_contados, total_sobras, total_faltas, valor_total_divergencia
)
SELECT
  c.id,
  c.empresa_id,
  (r.value->>'ciclo')::integer,
  (r.value->>'data')::date,
  (r.value->>'finalizado_em')::timestamptz,
  r.value->>'motivo',
  (r.value->'resumo'->>'total_contados')::integer,
  COALESCE((r.value->'resumo'->>'total_nao_contados')::integer, 0),
  (r.value->'resumo'->>'total_sobras')::integer,
  (r.value->'resumo'->>'total_faltas')::integer,
  (r.value->'resumo'->>'valor_total_divergencia')::numeric
FROM contagens c,
     jsonb_array_elements(COALESCE(c.resultados, '[]'::jsonb)) AS r(value)
WHERE c.resultados IS NOT NULL
  AND jsonb_array_length(c.resultados) > 0;

-- 4b. Item rows (contagem_resultado_itens)
INSERT INTO contagem_resultado_itens (
  resultado_id, empresa_id, produto_id, nome, unidade_sigla,
  saldo_sistema, quantidade_contada, diferenca, custo_medio, valor_divergencia, setores_breakdown
)
SELECT
  cr.id,
  cr.empresa_id,
  (item.value->>'produto_id')::uuid,
  item.value->>'nome',
  item.value->>'unidade_sigla',
  (item.value->>'saldo_sistema')::numeric,
  (item.value->>'quantidade_contada')::numeric,
  (item.value->>'diferenca')::numeric,
  COALESCE((item.value->>'custo_medio')::numeric, 0),
  (item.value->>'valor_divergencia')::numeric,
  COALESCE(item.value->'setores_breakdown', '[]'::jsonb)
FROM contagem_resultados cr
JOIN contagens c ON c.id = cr.contagem_id,
     LATERAL jsonb_array_elements(
       (SELECT r.value->'itens'
        FROM jsonb_array_elements(COALESCE(c.resultados, '[]'::jsonb)) AS r(value)
        WHERE (r.value->>'ciclo')::integer = cr.ciclo
        LIMIT 1)
     ) AS item(value);

-- 5. Marcar coluna JSONB como deprecated (nao dropar)
COMMENT ON COLUMN contagens.resultados IS 'DEPRECATED: migrado para contagem_resultados + contagem_resultado_itens. Mantido para rollback.';
