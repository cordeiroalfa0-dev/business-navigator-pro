-- ============================================================
-- BACKUP SYSTEM — Script único, idempotente (pode rodar várias vezes)
-- Cole e execute no SQL Editor do Supabase
-- ============================================================

-- 1. Colunas faltantes em backup_schedule
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='backup_schedule' AND column_name='status')
  THEN ALTER TABLE public.backup_schedule ADD COLUMN status text DEFAULT 'active'; END IF;
END $$;

-- 2. Coluna faltante em backup_history
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='backup_history' AND column_name='tables_count')
  THEN ALTER TABLE public.backup_history ADD COLUMN tables_count integer DEFAULT 0; END IF;
END $$;

-- 3. RLS
ALTER TABLE public.backup_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history   ENABLE ROW LEVEL SECURITY;

-- 4. Policies — drop todas primeiro para evitar conflito de nome
DO $$ DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename IN ('backup_schedule','backup_history')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      pol.policyname,
      (SELECT tablename FROM pg_policies
       WHERE schemaname='public' AND policyname=pol.policyname LIMIT 1));
  END LOOP;
END $$;

-- 5. Recria as policies
CREATE POLICY "backup_schedule_admin" ON public.backup_schedule
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "backup_history_admin" ON public.backup_history
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 6. Índice
CREATE INDEX IF NOT EXISTS idx_backup_history_executed_at
  ON public.backup_history (executed_at DESC);

-- 7. Agendamento semanal padrão
INSERT INTO public.backup_schedule (backup_name, frequency, day_of_week, hour, minute, status, next_backup_at)
SELECT 'weekly_auto','weekly',0,2,0,'active',
  date_trunc('week',now()) + interval '7 days' + interval '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM public.backup_schedule WHERE backup_name='weekly_auto');

-- 8. Bucket de storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('backups','backups',false,104857600,
  ARRAY['application/zip','application/json','application/octet-stream'])
ON CONFLICT (id) DO NOTHING;

-- 9. Policies do bucket — drop e recria
DROP POLICY IF EXISTS "Admin upload backups" ON storage.objects;
DROP POLICY IF EXISTS "Admin read backups"   ON storage.objects;
DROP POLICY IF EXISTS "Admin delete backups" ON storage.objects;

CREATE POLICY "Admin upload backups" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id='backups' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));

CREATE POLICY "Admin read backups" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id='backups' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));

CREATE POLICY "Admin delete backups" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id='backups' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin'));

-- Concluído!
SELECT 'Backup system configurado com sucesso!' AS resultado;
