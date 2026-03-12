-- =============================================
-- Migration 024: Contagens token + setor tipo + ajuste tracking
-- =============================================

-- 1. Campo tipo nos setores (principal vs apoio)
ALTER TABLE setores ADD COLUMN tipo TEXT NOT NULL DEFAULT 'principal'
  CHECK (tipo IN ('principal', 'apoio'));

-- 2. Token permanente nas contagens (acesso publico sem login)
ALTER TABLE contagens ADD COLUMN token UUID DEFAULT gen_random_uuid();
UPDATE contagens SET token = gen_random_uuid() WHERE token IS NULL;
ALTER TABLE contagens ALTER COLUMN token SET NOT NULL;
CREATE UNIQUE INDEX idx_contagens_token ON contagens(token);

-- 3. Tracking de ajuste nos itens de contagem
ALTER TABLE contagem_itens ADD COLUMN ajuste_registrado BOOLEAN DEFAULT false;
ALTER TABLE contagem_itens ADD COLUMN saldo_no_momento NUMERIC;

-- 4. Rastreabilidade: vincular ajustes a contagens
ALTER TABLE ajustes ADD COLUMN contagem_id UUID REFERENCES contagens(id) ON DELETE SET NULL;
