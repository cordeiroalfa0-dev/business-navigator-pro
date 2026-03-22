-- ============================================================
-- BACKUP SYSTEM — Complementos ao schema existente
-- Execute no SQL Editor do Supabase
-- As tabelas backup_schedule e backup_history já existem no
-- schema inicial. Este script apenas adiciona colunas faltantes
-- e garante que o RLS está correto.
-- ============================================================

-- 1. Adicionar coluna 'status' em backup_schedule se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'backup_schedule'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.backup_schedule ADD COLUMN status text DEFAULT 'active';
  END IF;
END $$;

-- 2. Adicionar coluna 'tables_count' em backup_history se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'backup_history'
      AND column_name  = 'tables_count'
  ) THEN
    ALTER TABLE public.backup_history ADD COLUMN tables_count integer DEFAULT 0;
  END IF;
END $$;

-- 3. Garantir RLS em backup_schedule
ALTER TABLE public.backup_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_backup_schedule" ON public.backup_schedule;
CREATE POLICY "admin_backup_schedule" ON public.backup_schedule
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Garantir RLS em backup_history
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "backup_history_admin_only" ON public.backup_history;
CREATE POLICY "backup_history_admin_only" ON public.backup_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Índice de performance para histórico
CREATE INDEX IF NOT EXISTS idx_backup_history_executed_at
  ON public.backup_history (executed_at DESC);

-- 6. Dados iniciais — agendamento semanal (nome alinhado com o código)
INSERT INTO public.backup_schedule (
  backup_name, frequency, day_of_week, hour, minute, status, next_backup_at
)
SELECT
  'weekly_auto', 'weekly', 0, 2, 0, 'active',
  date_trunc('week', now()) + interval '7 days' + interval '2 hours'
WHERE NOT EXISTS (
  SELECT 1 FROM public.backup_schedule WHERE backup_name = 'weekly_auto'
);

-- ============================================================
-- STORAGE — Bucket para backups automáticos
-- ============================================================

-- Cria o bucket se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backups', 'backups', false,
  104857600,
  ARRAY['application/zip','application/json','application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket
DROP POLICY IF EXISTS "Admin upload backups" ON storage.objects;
CREATE POLICY "Admin upload backups"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin read backups" ON storage.objects;
CREATE POLICY "Admin read backups"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin delete backups" ON storage.objects;
CREATE POLICY "Admin delete backups"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'backups'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
