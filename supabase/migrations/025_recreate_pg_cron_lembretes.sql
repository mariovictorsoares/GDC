-- =============================================
-- Migration 025: Recriar pg_cron job para lembretes de contagem
-- IMPORTANTE: Executar no SQL Editor do Supabase (não roda via CLI migrations)
-- O Bearer token DEVE ser identico ao CRON_SECRET configurado no Vercel
-- =============================================

-- Garantir extensões
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remover job anterior
DO $$
BEGIN
  PERFORM cron.unschedule('lembretes-contagem');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Recriar job: chama endpoint GET a cada minuto
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

-- SQL para diagnóstico (executar manualmente se necessário):
-- SELECT * FROM cron.job WHERE jobname = 'lembretes-contagem';
-- SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'lembretes-contagem') ORDER BY start_time DESC LIMIT 20;
