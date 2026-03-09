-- =============================================
-- Migration 020: Configurar pg_cron + pg_net para lembretes automáticos
-- =============================================
-- INSTRUÇÕES:
-- 1. No Vercel, adicione a env var: CRON_SECRET = cmv360cron2026
-- 2. Rode este SQL no SQL Editor do Supabase
-- =============================================

-- Habilitar extensões (já disponíveis no Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remover job anterior se existir
DO $$
BEGIN
  PERFORM cron.unschedule('lembretes-contagem');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Criar cron job: chama o endpoint GET a cada minuto
SELECT cron.schedule(
  'lembretes-contagem',
  '* * * * *',
  $$
  SELECT net.http_get(
    url := 'https://www.cmv360app.com.br/api/cron/lembretes-contagem',
    headers := '{"Authorization": "Bearer cmv360cron2026"}'::jsonb
  );
  $$
);
