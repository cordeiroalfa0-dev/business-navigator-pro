-- ============================================================
-- Keep-Alive System — Supabase Free Tier
-- Evita auto-pause após 7 dias sem atividade
-- Cron: a cada 2 dias às 08:00 UTC  (0 8 */2 * *)
-- Gerado por setup_sanremo.py
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Tabela de heartbeats
CREATE TABLE IF NOT EXISTS public.system_heartbeats (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL    DEFAULT now(),
    message    TEXT,
    source     TEXT        DEFAULT 'cron',
    metadata   JSONB       DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_heartbeats_created_at
    ON public.system_heartbeats(created_at);

-- Row Level Security
ALTER TABLE public.system_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_access"
    ON public.system_heartbeats
    FOR ALL
    USING (auth.role() = 'service_role');

-- View de monitoramento
CREATE OR REPLACE VIEW system_heartbeat_status AS
SELECT
    MAX(created_at)                                        AS last_heartbeat,
    COUNT(*) FILTER (
        WHERE created_at > now() - interval '7 days'
    )                                                      AS heartbeats_last_week,
    now() - MAX(created_at)                                AS time_since_last,
    CASE
        WHEN MAX(created_at) > now() - interval '3 days'  THEN 'OK'
        WHEN MAX(created_at) > now() - interval '6 days'  THEN 'AVISO'
        ELSE                                                    'CRITICO'
    END                                                    AS status
FROM public.system_heartbeats;

-- Cron job: a cada 2 dias às 08:00 UTC
SELECT cron.schedule(
    'keep-alive-every-2-days',
    '0 8 */2 * *',
    $$
    SELECT net.http_post(
        url     := 'https://fntenxsyxzdrmqiweorq.supabase.co/functions/v1/keep-alive',
        headers := jsonb_build_object('Content-Type', 'application/json'),
        body    := '{}'::jsonb
    );
    $$
);
