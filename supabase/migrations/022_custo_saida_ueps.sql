-- =====================================================
-- Migration 022: Custo de Saída UEPS (Último Custo de Entrada)
-- Altera a lógica de cálculo de custo de saída para usar
-- o custo unitário da entrada mais recente (UEPS) ao invés
-- da média ponderada mensal (CMC).
-- =====================================================

-- 1. NOVA FUNÇÃO: calcular_custo_ueps
-- Busca o custo unitário da entrada mais recente até a data de referência
-- Inclui filtro por empresa_id para isolamento multi-tenant
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_custo_ueps(p_produto_id UUID, p_empresa_id UUID, p_data DATE)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  v_custo DECIMAL(15,4);
  v_custo_inicial DECIMAL(15,4);
BEGIN
  -- Buscar custo unitário da entrada mais recente até a data da saída
  SELECT ROUND(valor_total / NULLIF(quantidade, 0), 4)
  INTO v_custo
  FROM entradas
  WHERE produto_id = p_produto_id
    AND empresa_id = p_empresa_id
    AND data <= p_data
    AND quantidade > 0
  ORDER BY data DESC, created_at DESC
  LIMIT 1;

  -- Se não houver entrada, fallback para preco_inicial do produto
  IF v_custo IS NULL OR v_custo = 0 THEN
    SELECT preco_inicial INTO v_custo_inicial
    FROM produtos
    WHERE id = p_produto_id;

    v_custo := COALESCE(v_custo_inicial, 0);
  END IF;

  RETURN COALESCE(v_custo, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. ATUALIZAR TRIGGER DE SAÍDA PARA USAR UEPS
-- Nota: o custo só é calculado no INSERT (quando custo_saida é NULL).
-- Em UPDATE, o custo_saida já existe e não é recalculado automaticamente.
-- Para forçar recálculo no UPDATE, setar custo_saida = NULL antes.
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_semana_saida()
RETURNS TRIGGER AS $$
DECLARE
  v_custo_unitario DECIMAL(15,4);
BEGIN
  -- Calcular semana
  IF NEW.semana IS NULL OR NEW.semana = '' THEN
    NEW.semana := calcular_semana(NEW.data);
  END IF;

  -- Calcular custo de saída usando UEPS (último custo de entrada)
  IF NEW.custo_saida IS NULL THEN
    v_custo_unitario := calcular_custo_ueps(NEW.produto_id, NEW.empresa_id, NEW.data);
    NEW.custo_saida := v_custo_unitario * NEW.quantidade;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Nota: a função calcular_custo_mes() e a trigger trigger_atualizar_custo_mensal()
-- são mantidas pois a tabela custos_mensais ainda é usada por relatórios.
-- Apenas o cálculo de custo de SAÍDA muda para UEPS.
