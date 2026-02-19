-- Adicionar coluna fornecedor_id na tabela de entradas
ALTER TABLE entradas ADD COLUMN IF NOT EXISTS fornecedor_id UUID REFERENCES fornecedores(id);

-- Índice para consultas por fornecedor
CREATE INDEX IF NOT EXISTS idx_entradas_fornecedor ON entradas(fornecedor_id);
