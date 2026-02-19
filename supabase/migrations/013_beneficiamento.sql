-- =====================================================
-- MIGRATION 013: Beneficiamento / Produção
-- =====================================================
-- Permite que produtos brutos sejam processados em produtos finais.
-- Fluxo: Cadastro (beneficiável) → Saída (beneficiamento) → Entrada (resolução)

-- 1. Colunas em produtos
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS beneficiavel BOOLEAN DEFAULT false;
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS is_produto_final BOOLEAN DEFAULT false;

-- 2. Tabela de vínculo: produto de origem → produtos finais
CREATE TABLE IF NOT EXISTS produtos_beneficiamento (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_origem_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  produto_final_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(produto_origem_id, produto_final_id)
);

CREATE INDEX IF NOT EXISTS idx_prod_benef_origem ON produtos_beneficiamento(produto_origem_id);
CREATE INDEX IF NOT EXISTS idx_prod_benef_final ON produtos_beneficiamento(produto_final_id);
CREATE INDEX IF NOT EXISTS idx_prod_benef_empresa ON produtos_beneficiamento(empresa_id);

-- 3. Coluna origem_beneficiamento em entradas (para excluir de compras/CMV)
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS origem_beneficiamento BOOLEAN DEFAULT false;

-- 4. Expandir CHECK do tipo em saídas para incluir 'beneficiamento'
ALTER TABLE saidas DROP CONSTRAINT IF EXISTS saidas_tipo_check;
ALTER TABLE saidas ADD CONSTRAINT saidas_tipo_check
  CHECK (tipo IN ('transferencia', 'definitiva', 'beneficiamento'));

-- 5. Tabela de controle de beneficiamentos (pendente/resolvido)
CREATE TABLE IF NOT EXISTS beneficiamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  saida_id UUID NOT NULL REFERENCES saidas(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'resolvido')),
  data_resolucao DATE,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(saida_id)
);

CREATE INDEX IF NOT EXISTS idx_beneficiamentos_saida ON beneficiamentos(saida_id);
CREATE INDEX IF NOT EXISTS idx_beneficiamentos_status ON beneficiamentos(status);
CREATE INDEX IF NOT EXISTS idx_beneficiamentos_empresa ON beneficiamentos(empresa_id);

-- 6. Tabela de itens gerados pela resolução de um beneficiamento
CREATE TABLE IF NOT EXISTS beneficiamento_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiamento_id UUID NOT NULL REFERENCES beneficiamentos(id) ON DELETE CASCADE,
  entrada_id UUID NOT NULL REFERENCES entradas(id) ON DELETE CASCADE,
  produto_final_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade DECIMAL(15,4) NOT NULL CHECK (quantidade > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_benef_itens_beneficiamento ON beneficiamento_itens(beneficiamento_id);
CREATE INDEX IF NOT EXISTS idx_benef_itens_entrada ON beneficiamento_itens(entrada_id);

-- 7. Recriar view v_saldo_estoque
--    Mudança: saldo_atual e valor_estoque agora subtraem TODAS as saídas
--    exceto transferências (ou seja, definitiva + beneficiamento reduzem o saldo)
DROP VIEW IF EXISTS v_saldo_estoque;
CREATE VIEW v_saldo_estoque AS
SELECT
  p.id as produto_id,
  c.nome as categoria,
  p.nome as produto,
  u.sigla as unidade,
  p.estoque_inicial,
  COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0) as total_entradas,
  COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0) as total_saidas,
  COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as total_ajustes,
  -- Estoque Principal: entradas - TODAS as saídas (transferências, definitivas e beneficiamento saem do principal)
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as saldo_principal,
  -- Estoque de Apoio: acumula transferências recebidas
  COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo = 'transferencia'), 0) as saldo_apoio,
  -- Saldo total: EI + entradas - (definitiva + beneficiamento) + ajustes
  -- Transferências são internas, não reduzem saldo total
  p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo != 'transferencia'), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0) as saldo_atual,
  calcular_custo_medio(p.id) as custo_medio,
  (p.estoque_inicial
    + COALESCE((SELECT SUM(quantidade) FROM entradas WHERE produto_id = p.id), 0)
    - COALESCE((SELECT SUM(quantidade) FROM saidas WHERE produto_id = p.id AND tipo != 'transferencia'), 0)
    + COALESCE((SELECT SUM(quantidade) FROM ajustes WHERE produto_id = p.id), 0))
    * calcular_custo_medio(p.id) as valor_estoque
FROM produtos p
LEFT JOIN categorias c ON p.categoria_id = c.id
LEFT JOIN unidades u ON p.unidade_id = u.id
WHERE p.ativo = true
ORDER BY c.nome, p.nome;
