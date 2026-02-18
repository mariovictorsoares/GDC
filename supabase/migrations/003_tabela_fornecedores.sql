-- =====================================================
-- MIGRAÇÃO 003 - Tabela de Fornecedores
-- =====================================================

-- Criar tabela fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_empresa VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  cep VARCHAR(9),
  logradouro VARCHAR(200),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fornecedores_nome ON fornecedores(nome_empresa);
CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_ativo ON fornecedores(ativo);
