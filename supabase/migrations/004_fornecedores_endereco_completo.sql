-- =====================================================
-- MIGRAÇÃO 004 - Endereco completo na tabela fornecedores
-- Substitui coluna 'endereco' por campos separados
-- =====================================================

-- Remover coluna antiga se existir
ALTER TABLE fornecedores DROP COLUMN IF EXISTS endereco;

-- Adicionar campos de endereco completo
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS cep VARCHAR(9);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS logradouro VARCHAR(200);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS complemento VARCHAR(100);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS estado VARCHAR(2);
