-- Migration: Transferência entre lojas
-- Adiciona campo empresa_destino_id na tabela saidas para permitir
-- transferências entre empresas do mesmo usuário

ALTER TABLE saidas
ADD COLUMN empresa_destino_id UUID REFERENCES empresas(id) ON DELETE SET NULL;

-- Índice para consultas de transferências recebidas
CREATE INDEX IF NOT EXISTS idx_saidas_empresa_destino ON saidas(empresa_destino_id)
WHERE empresa_destino_id IS NOT NULL;

COMMENT ON COLUMN saidas.empresa_destino_id IS 'Empresa destino para transferências entre lojas. NULL = estoque de apoio (comportamento original)';
