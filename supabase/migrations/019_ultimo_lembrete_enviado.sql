-- Adiciona coluna para deduplicação de lembretes
-- Armazena timestamp do último lembrete enviado para evitar duplicatas
ALTER TABLE contagens
ADD COLUMN IF NOT EXISTS ultimo_lembrete_enviado TIMESTAMPTZ;

COMMENT ON COLUMN contagens.ultimo_lembrete_enviado IS 'Timestamp do último lembrete WhatsApp enviado (para deduplicação)';
