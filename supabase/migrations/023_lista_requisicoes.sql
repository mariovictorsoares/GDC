-- =====================================================
-- Migration 023: Lista de Requisições
-- Sistema para responsáveis de setor solicitarem itens
-- ao estoquista para envio ao estoque de apoio.
--
-- Fluxo QR Code: o responsável do setor deve estar logado
-- no sistema. O QR code leva à página de requisição com
-- empresa_id e setor_id como parâmetros. A criação da
-- requisição usa as credenciais do usuário logado.
-- =====================================================

-- 1. TABELA DE REQUISIÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS requisicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  setor_id UUID NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enviado', 'cancelado')),
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  solicitante_nome TEXT,
  observacao TEXT,
  -- Preenchido pelo estoquista ao enviar
  enviado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_envio TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requisicoes_empresa" ON requisicoes
  FOR ALL USING (empresa_id IN (
    SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
  ));

-- 2. TABELA DE ITENS DA REQUISIÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS requisicao_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requisicao_id UUID NOT NULL REFERENCES requisicoes(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_solicitada DECIMAL(15,4) NOT NULL CHECK (quantidade_solicitada > 0),
  -- Preenchido pelo estoquista (pode diferir da solicitada)
  quantidade_enviada DECIMAL(15,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Mesmo produto não pode aparecer duas vezes na mesma requisição
  UNIQUE(requisicao_id, produto_id)
);

ALTER TABLE requisicao_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requisicao_itens_via_requisicao" ON requisicao_itens
  FOR ALL USING (requisicao_id IN (
    SELECT id FROM requisicoes WHERE empresa_id IN (
      SELECT empresa_id FROM usuarios_empresas WHERE user_id = auth.uid()
    )
  ));

-- 3. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_requisicoes_empresa_status ON requisicoes(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_requisicoes_setor ON requisicoes(setor_id);
CREATE INDEX IF NOT EXISTS idx_requisicoes_data ON requisicoes(data);
CREATE INDEX IF NOT EXISTS idx_requisicao_itens_requisicao ON requisicao_itens(requisicao_id);
CREATE INDEX IF NOT EXISTS idx_requisicao_itens_produto ON requisicao_itens(produto_id);

-- 4. TRIGGER PARA updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_requisicoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_requisicoes_updated_at
  BEFORE UPDATE ON requisicoes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_requisicoes_updated_at();
