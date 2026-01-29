-- =====================================================
-- SISTEMA DE CONTROLE DE ESTOQUE - CD
-- Migração Inicial - Estrutura do Banco de Dados
-- =====================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS DE DADOS MESTRES
-- =====================================================

-- Categorias de produtos
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  codigo VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Unidades de medida
CREATE TABLE unidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sigla VARCHAR(10) NOT NULL UNIQUE,
  descricao VARCHAR(100)
);

-- Destinos de saída
CREATE TABLE destinos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true
);

-- Configurações do sistema
CREATE TABLE configuracoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL
);

-- =====================================================
-- TABELA DE PRODUTOS
-- =====================================================

CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nome VARCHAR(200) NOT NULL,
  unidade_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
  estoque_inicial DECIMAL(15,4) DEFAULT 0,
  preco_inicial DECIMAL(15,4) DEFAULT 0,
  estoque_minimo DECIMAL(15,4) DEFAULT 0,
  margem_seguranca DECIMAL(5,2) DEFAULT 0,
  tempo_reposicao INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para produtos
CREATE INDEX idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX idx_produtos_nome ON produtos(nome);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);

-- =====================================================
-- TABELA DE CUSTOS MENSAIS
-- =====================================================

CREATE TABLE custos_mensais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  custo DECIMAL(15,4) DEFAULT 0,
  UNIQUE(produto_id, ano, mes)
);

CREATE INDEX idx_custos_produto ON custos_mensais(produto_id);
CREATE INDEX idx_custos_periodo ON custos_mensais(ano, mes);

-- =====================================================
-- TABELA DE ENTRADAS (COMPRAS)
-- =====================================================

CREATE TABLE entradas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  semana VARCHAR(20),
  quantidade DECIMAL(15,4) NOT NULL CHECK (quantidade > 0),
  custo_unitario DECIMAL(15,4) NOT NULL CHECK (custo_unitario >= 0),
  valor_total DECIMAL(15,4) GENERATED ALWAYS AS (quantidade * custo_unitario) STORED,
  numero_nf VARCHAR(50),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_entradas_produto ON entradas(produto_id);
CREATE INDEX idx_entradas_data ON entradas(data);
CREATE INDEX idx_entradas_periodo ON entradas(data, produto_id);

-- =====================================================
-- TABELA DE SAÍDAS
-- =====================================================

CREATE TABLE saidas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  destino_id UUID REFERENCES destinos(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  semana VARCHAR(20),
  quantidade DECIMAL(15,4) NOT NULL CHECK (quantidade > 0),
  custo_saida DECIMAL(15,4),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saidas_produto ON saidas(produto_id);
CREATE INDEX idx_saidas_destino ON saidas(destino_id);
CREATE INDEX idx_saidas_data ON saidas(data);
CREATE INDEX idx_saidas_periodo ON saidas(data, produto_id);

-- =====================================================
-- TABELA DE AJUSTES DE ESTOQUE
-- =====================================================

CREATE TABLE ajustes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  semana VARCHAR(20),
  quantidade DECIMAL(15,4) NOT NULL,
  motivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ajustes_produto ON ajustes(produto_id);
CREATE INDEX idx_ajustes_data ON ajustes(data);

-- =====================================================
-- TABELA DE FATURAMENTOS MENSAIS
-- =====================================================

CREATE TABLE faturamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  valor DECIMAL(15,4) NOT NULL DEFAULT 0,
  UNIQUE(ano, mes)
);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Função para calcular a semana do mês baseada na data
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
  ELSE
    RETURN 'SEMANA 5';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para calcular custo médio ponderado de um produto
CREATE OR REPLACE FUNCTION calcular_custo_medio(p_produto_id UUID)
RETURNS DECIMAL(15,4) AS $$
DECLARE
  total_valor DECIMAL(15,4);
  total_qtd DECIMAL(15,4);
  custo_inicial DECIMAL(15,4);
  qtd_inicial DECIMAL(15,4);
BEGIN
  -- Buscar estoque e preço inicial
  SELECT estoque_inicial, preco_inicial
  INTO qtd_inicial, custo_inicial
  FROM produtos
  WHERE id = p_produto_id;

  -- Somar todas as entradas
  SELECT COALESCE(SUM(valor_total), 0), COALESCE(SUM(quantidade), 0)
  INTO total_valor, total_qtd
  FROM entradas
  WHERE produto_id = p_produto_id;

  -- Adicionar estoque inicial
  total_valor := total_valor + (qtd_inicial * COALESCE(custo_inicial, 0));
  total_qtd := total_qtd + qtd_inicial;

  -- Retornar custo médio
  IF total_qtd > 0 THEN
    RETURN ROUND(total_valor / total_qtd, 4);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para preencher automaticamente a semana nas entradas
CREATE OR REPLACE FUNCTION trigger_set_semana_entrada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.semana IS NULL OR NEW.semana = '' THEN
    NEW.semana := calcular_semana(NEW.data);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_entradas_semana
  BEFORE INSERT OR UPDATE ON entradas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_semana_entrada();

-- Trigger para preencher automaticamente a semana nas saídas
CREATE OR REPLACE FUNCTION trigger_set_semana_saida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.semana IS NULL OR NEW.semana = '' THEN
    NEW.semana := calcular_semana(NEW.data);
  END IF;
  -- Calcular custo de saída baseado no custo médio
  IF NEW.custo_saida IS NULL THEN
    NEW.custo_saida := calcular_custo_medio(NEW.produto_id) * NEW.quantidade;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_saidas_semana_custo
  BEFORE INSERT OR UPDATE ON saidas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_semana_saida();

-- Trigger para preencher automaticamente a semana nos ajustes
CREATE OR REPLACE FUNCTION trigger_set_semana_ajuste()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.semana IS NULL OR NEW.semana = '' THEN
    NEW.semana := calcular_semana(NEW.data);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ajustes_semana
  BEFORE INSERT OR UPDATE ON ajustes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_semana_ajuste();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View: Saldo de estoque por produto
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

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir unidades padrão
INSERT INTO unidades (sigla, descricao) VALUES
  ('KG', 'Quilograma'),
  ('UN', 'Unidade'),
  ('PC', 'Pacote'),
  ('CX', 'Caixa'),
  ('L', 'Litro'),
  ('ML', 'Mililitro'),
  ('G', 'Grama'),
  ('DZ', 'Dúzia'),
  ('FD', 'Fardo'),
  ('PT', 'Pote'),
  ('GF', 'Garrafa'),
  ('LT', 'Lata')
ON CONFLICT (sigla) DO NOTHING;

-- Inserir destinos padrão (baseado na planilha)
INSERT INTO destinos (nome, ativo) VALUES
  ('LOJA 1', true),
  ('LOJA 2', true),
  ('LOJA 3', true),
  ('ESTOQUE APOIO', true),
  ('FABRICA', true),
  ('COZINHA', true)
ON CONFLICT (nome) DO NOTHING;

-- Inserir categorias padrão (baseado na planilha)
INSERT INTO categorias (nome, codigo) VALUES
  ('ACENDEDORES', 'ACENDEDORES'),
  ('ACESSÓRIO', 'ACESSORIO'),
  ('APERITIVOS', 'APERITIVOS'),
  ('CANCIAN', 'CANCIAN'),
  ('CARNE MOÍDA', 'CARNE_MOIDA'),
  ('DEFUMADO', 'DEFUMADO'),
  ('DIVERSOS', 'DIVERSOS'),
  ('DO CHEF', 'DO_CHEF'),
  ('DOCE', 'DOCE'),
  ('DUROK', 'DUROK'),
  ('EMBALAGENS', 'EMBALAGENS'),
  ('ESPECIAL', 'ESPECIAL'),
  ('FASANO', 'FASANO'),
  ('GOLD', 'GOLD'),
  ('GOLD (WAGYU)', 'GOLD_WAGYU'),
  ('GOLD RESERVA', 'GOLD_RESERVA'),
  ('GRASS FED', 'GRASS_FED'),
  ('GUARNIÇÃO', 'GUARNICAO'),
  ('KORIN', 'KORIN'),
  ('LENHA', 'LENHA'),
  ('MOLHOS', 'MOLHOS'),
  ('MTP', 'MTP'),
  ('NELORE DO GOLIAS', 'NELORE_DO_GOLIAS'),
  ('ORIGINAL BRAGANÇA', 'ORIGINAL_BRAGANCA'),
  ('PIMENTAS', 'PIMENTAS'),
  ('PORCIONADOS', 'PORCIONADOS'),
  ('PROCESSADOS HAMBÚRGUER', 'PROCESSADOS_HAMBURGUER'),
  ('PROTEÍNA', 'PROTEINA'),
  ('SAL', 'SAL'),
  ('TÁBUAS', 'TABUAS'),
  ('TEMPEROS', 'TEMPEROS'),
  ('UTENS. CHURRASCO', 'UTEN_CHURRASCO'),
  ('VL CARNES', 'VL_CARNES')
ON CONFLICT (nome) DO NOTHING;

-- Inserir configurações iniciais
INSERT INTO configuracoes (chave, valor) VALUES
  ('nome_empresa', 'NOME DA EMPRESA'),
  ('ano_base', '2025'),
  ('meta_cmv', '0.35')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security) - Opcional
-- =====================================================

-- Por enquanto, vamos manter as tabelas públicas
-- Para habilitar RLS no futuro, descomente as linhas abaixo:

-- ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE destinos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE entradas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saidas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ajustes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE faturamentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custos_mensais ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
