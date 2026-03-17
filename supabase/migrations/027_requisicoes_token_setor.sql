-- =====================================================
-- Migration 027: Token de requisição nos setores
-- Adiciona token público para acesso via QR code
-- e link de rastreabilidade nas saídas.
-- =====================================================

-- 1. Token público no setor (para QR code de requisição)
ALTER TABLE setores ADD COLUMN IF NOT EXISTS token_requisicao UUID DEFAULT gen_random_uuid();
UPDATE setores SET token_requisicao = gen_random_uuid() WHERE token_requisicao IS NULL;
ALTER TABLE setores ALTER COLUMN token_requisicao SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_setores_token_requisicao ON setores(token_requisicao);

-- 2. Link saída → requisição (rastreabilidade)
ALTER TABLE saidas ADD COLUMN IF NOT EXISTS requisicao_id UUID REFERENCES requisicoes(id) ON DELETE SET NULL;
