-- =====================================================
-- CORREÇÕES DE ESPECIFICAÇÃO - SISTEMA DE ESTOQUE
-- Migration 002
-- =====================================================

-- 1. ATUALIZAR FUNÇÃO DE CÁLCULO DE SEMANA PARA INCLUIR SEMANA 6
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_semana(p_data DATE)
RETURNS VARCHAR(20) AS $$
DECLARE
  dia_mes INTEGER;
BEGIN
  dia_mes := EXTRACT(DAY FROM p_data);

  IF dia_mes <= 7 THEN
    RETURN 'SEMANA 1';
  ELSIF dia_mes <= 14 THEN
    RETURN 'SEMANA 2';
  ELSIF dia_mes <= 21 THEN
    RETURN 'SEMANA 3';
  ELSIF dia_mes <= 28 THEN
    RETURN 'SEMANA 4';
  ELSIF dia_mes <= 31 THEN
    -- Dias 29, 30, 31 podem ser semana 5 ou 6 dependendo do mês
    -- Usando lógica baseada no número da semana do mês
    DECLARE
      primeiro_dia DATE;
      semana_atual INTEGER;
    BEGIN
      primeiro_dia := DATE_TRUNC('month', p_data);
      semana_atual := EXTRACT(WEEK FROM p_data) - EXTRACT(WEEK FROM primeiro_dia) + 1;
      IF semana_atual >= 6 THEN
        RETURN 'SEMANA 6';
      ELSE
        RETURN 'SEMANA 5';
      END IF;
    END;
  ELSE
    RETURN 'SEMANA 5';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. FUNÇÃO PARA CALCULAR CUSTO DO MÊS ATUAL
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_custo_mes(p_produto_id UUID, p_ano INTEGER, p_mes INTEGER)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  custo_mes DECIMAL(15,4);
  custo_inicial DECIMAL(15,4);
  total_valor DECIMAL(15,4);
  total_qtd DECIMAL(15,4);
  data_inicio DATE;
  data_fim DATE;
BEGIN
  -- Calcular datas do mês
  data_inicio := MAKE_DATE(p_ano, p_mes, 1);
  data_fim := (data_inicio + INTERVAL '1 month - 1 day')::DATE;

  -- Buscar custo inicial do produto
  SELECT preco_inicial INTO custo_inicial
  FROM produtos
  WHERE id = p_produto_id;

  -- Calcular custo médio das entradas do mês
  SELECT COALESCE(SUM(valor_total), 0), COALESCE(SUM(quantidade), 0)
  INTO total_valor, total_qtd
  FROM entradas
  WHERE produto_id = p_produto_id
    AND data >= data_inicio
    AND data <= data_fim;

  -- Se houver entradas no mês, usar média das entradas
  IF total_qtd > 0 THEN
    custo_mes := ROUND(total_valor / total_qtd, 4);
  ELSE
    -- Se não houver entradas, verificar custo do mês anterior
    SELECT custo INTO custo_mes
    FROM custos_mensais
    WHERE produto_id = p_produto_id
      AND (ano < p_ano OR (ano = p_ano AND mes < p_mes))
    ORDER BY ano DESC, mes DESC
    LIMIT 1;

    -- Se não houver custo anterior, usar custo inicial
    IF custo_mes IS NULL OR custo_mes = 0 THEN
      custo_mes := COALESCE(custo_inicial, 0);
    END IF;
  END IF;

  RETURN COALESCE(custo_mes, 0);
END;
$$ LANGUAGE plpgsql;

-- 3. ATUALIZAR TRIGGER DE SAÍDA PARA USAR CUSTO DO MÊS
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_semana_saida()
RETURNS TRIGGER AS $$
DECLARE
  v_ano INTEGER;
  v_mes INTEGER;
  v_custo_mes DECIMAL(15,4);
  v_custo_inicial DECIMAL(15,4);
BEGIN
  -- Calcular semana
  IF NEW.semana IS NULL OR NEW.semana = '' THEN
    NEW.semana := calcular_semana(NEW.data);
  END IF;

  -- Calcular custo de saída baseado na regra da especificação
  IF NEW.custo_saida IS NULL THEN
    v_ano := EXTRACT(YEAR FROM NEW.data);
    v_mes := EXTRACT(MONTH FROM NEW.data);

    -- Buscar custo do mês atual
    v_custo_mes := calcular_custo_mes(NEW.produto_id, v_ano, v_mes);

    -- Se custo do mês for 0, usar custo inicial
    IF v_custo_mes = 0 OR v_custo_mes IS NULL THEN
      SELECT preco_inicial INTO v_custo_inicial
      FROM produtos
      WHERE id = NEW.produto_id;

      NEW.custo_saida := COALESCE(v_custo_inicial, 0) * NEW.quantidade;
    ELSE
      NEW.custo_saida := v_custo_mes * NEW.quantidade;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TRIGGER PARA ATUALIZAR CUSTO MÉDIO MENSAL APÓS ENTRADA
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_atualizar_custo_mensal()
RETURNS TRIGGER AS $$
DECLARE
  v_ano INTEGER;
  v_mes INTEGER;
  v_custo DECIMAL(15,4);
BEGIN
  v_ano := EXTRACT(YEAR FROM NEW.data);
  v_mes := EXTRACT(MONTH FROM NEW.data);

  -- Calcular novo custo médio do mês
  v_custo := calcular_custo_mes(NEW.produto_id, v_ano, v_mes);

  -- Inserir ou atualizar na tabela de custos mensais
  INSERT INTO custos_mensais (produto_id, ano, mes, custo)
  VALUES (NEW.produto_id, v_ano, v_mes, v_custo)
  ON CONFLICT (produto_id, ano, mes)
  DO UPDATE SET custo = v_custo;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para entradas
DROP TRIGGER IF EXISTS tr_entradas_custo_mensal ON entradas;
CREATE TRIGGER tr_entradas_custo_mensal
  AFTER INSERT OR UPDATE ON entradas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_atualizar_custo_mensal();

-- 5. FUNÇÃO PARA RECALCULAR TODOS OS CUSTOS MENSAIS
-- =====================================================

CREATE OR REPLACE FUNCTION recalcular_custos_mensais()
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  -- Limpar tabela de custos mensais
  DELETE FROM custos_mensais;

  -- Recalcular para cada produto/mês que tenha entradas
  FOR r IN
    SELECT DISTINCT
      produto_id,
      EXTRACT(YEAR FROM data)::INTEGER as ano,
      EXTRACT(MONTH FROM data)::INTEGER as mes
    FROM entradas
    ORDER BY ano, mes
  LOOP
    INSERT INTO custos_mensais (produto_id, ano, mes, custo)
    VALUES (r.produto_id, r.ano, r.mes, calcular_custo_mes(r.produto_id, r.ano, r.mes))
    ON CONFLICT (produto_id, ano, mes) DO UPDATE SET custo = EXCLUDED.custo;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar recálculo inicial
SELECT recalcular_custos_mensais();

-- 6. ATUALIZAR VIEW DE SALDO PARA INCLUIR CATEGORIA
-- =====================================================

CREATE OR REPLACE VIEW v_saldo_estoque AS
SELECT
  p.id as produto_id,
  c.nome as categoria,
  p.nome as produto,
  u.sigla as unidade,
  p.estoque_inicial,
  COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0) as total_entradas,
  COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0) as total_saidas,
  COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as total_ajustes,
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as saldo_atual,
  calcular_custo_medio(p.id) as custo_medio,
  (p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0))
    * calcular_custo_medio(p.id) as valor_estoque
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN unidades u ON p.unidade_id = u.id
WHERE p.ativo = true
ORDER BY c.nome, p.nome;

-- 7. ADICIONAR CONFIGURAÇÃO DE SENHA PARA AJUSTES
-- =====================================================

INSERT INTO configuracoes (chave, valor)
VALUES ('senha_ajustes', '1234')
ON CONFLICT (chave) DO NOTHING;
