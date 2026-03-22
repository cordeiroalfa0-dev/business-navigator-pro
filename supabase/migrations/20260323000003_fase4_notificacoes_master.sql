-- ============================================================
-- FASE 4 — Alertas em tempo real
-- Estende notificações para role 'master' além de 'admin'
-- Garante que realtime funciona com filtro por admin_id
-- ============================================================

-- Atualizar a função gerar_alertas_prazo para notificar admin E master
CREATE OR REPLACE FUNCTION public.gerar_alertas_prazo()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dest RECORD;
  v_meta RECORD;
  v_obra RECORD;
BEGIN

  -- ── Loop por todos os admins e masters ───────────────────────────────
  FOR v_dest IN
    SELECT user_id FROM public.user_roles
    WHERE role IN ('admin', 'master')
  LOOP

    -- ── 1. Metas em risco com prazo futuro ──────────────────────────────
    FOR v_meta IN
      SELECT id, nome, prazo, status
      FROM public.metas
      WHERE status IN ('em_risco', 'atencao')
        AND prazo IS NOT NULL
        AND prazo::date >= current_date
        AND prazo::date <= current_date + interval '7 days'
        AND (is_deleted IS NULL OR is_deleted = false)
    LOOP
      -- Evita duplicata: não cria se já existe não lida para este item
      IF NOT EXISTS (
        SELECT 1 FROM public.admin_notifications
        WHERE admin_id = v_dest.user_id
          AND type = 'meta_alert'
          AND message LIKE '%' || v_meta.id::text || '%'
          AND is_read = false
          AND created_at > now() - interval '24 hours'
      ) THEN
        INSERT INTO public.admin_notifications
          (admin_id, type, title, message, severity, is_read)
        VALUES (
          v_dest.user_id,
          'meta_alert',
          'Meta em risco: ' || v_meta.nome,
          'Status: ' || v_meta.status || ' | Prazo: ' || v_meta.prazo::text || ' | ID: ' || v_meta.id::text,
          CASE WHEN v_meta.status = 'em_risco' THEN 'critical' ELSE 'warning' END,
          false
        );
      END IF;
    END LOOP;

    -- ── 2. Metas com prazo vencido e não atingidas ──────────────────────
    FOR v_meta IN
      SELECT id, nome, prazo, status
      FROM public.metas
      WHERE prazo IS NOT NULL
        AND prazo::date < current_date
        AND status NOT IN ('atingida')
        AND (is_deleted IS NULL OR is_deleted = false)
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.admin_notifications
        WHERE admin_id = v_dest.user_id
          AND type = 'meta_atrasada'
          AND message LIKE '%' || v_meta.id::text || '%'
          AND is_read = false
          AND created_at > now() - interval '24 hours'
      ) THEN
        INSERT INTO public.admin_notifications
          (admin_id, type, title, message, severity, is_read)
        VALUES (
          v_dest.user_id,
          'meta_atrasada',
          'Meta atrasada: ' || v_meta.nome,
          'Prazo vencido em ' || v_meta.prazo::text || ' | Status: ' || v_meta.status || ' | ID: ' || v_meta.id::text,
          'critical',
          false
        );
      END IF;
    END LOOP;

    -- ── 3. Obras com data prevista vencida e não entregues ──────────────
    FOR v_obra IN
      SELECT id, nome, data_prevista, etapa_atual
      FROM public.execucao_obras
      WHERE data_prevista IS NOT NULL
        AND data_prevista::date < current_date
        AND etapa_atual != 'Entregue'
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.admin_notifications
        WHERE admin_id = v_dest.user_id
          AND type = 'obra_atrasada'
          AND message LIKE '%' || v_obra.id::text || '%'
          AND is_read = false
          AND created_at > now() - interval '24 hours'
      ) THEN
        INSERT INTO public.admin_notifications
          (admin_id, type, title, message, severity, is_read)
        VALUES (
          v_dest.user_id,
          'obra_atrasada',
          'Obra atrasada: ' || v_obra.nome,
          'Previsão vencida em ' || v_obra.data_prevista::text || ' | Etapa: ' || v_obra.etapa_atual || ' | ID: ' || v_obra.id::text,
          'critical',
          false
        );
      END IF;
    END LOOP;

  END LOOP;
END;
$$;

-- Garantir RLS correto para realtime funcionar com filtro por admin_id
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications"        ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.admin_notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.admin_notifications;

-- SELECT: cada usuário vê apenas as suas
CREATE POLICY "notif_select" ON public.admin_notifications
  FOR SELECT USING (admin_id = auth.uid());

-- INSERT: sistema (service_role) pode inserir para qualquer admin_id
CREATE POLICY "notif_insert" ON public.admin_notifications
  FOR INSERT WITH CHECK (true);

-- UPDATE: cada usuário atualiza apenas as suas (marcar como lida)
CREATE POLICY "notif_update" ON public.admin_notifications
  FOR UPDATE USING (admin_id = auth.uid());

-- DELETE: cada usuário deleta apenas as suas
CREATE POLICY "notif_delete" ON public.admin_notifications
  FOR DELETE USING (admin_id = auth.uid());

-- Índice para performance do realtime filter
CREATE INDEX IF NOT EXISTS idx_admin_notifications_admin_id
  ON public.admin_notifications (admin_id, is_read, created_at DESC);

COMMENT ON FUNCTION public.gerar_alertas_prazo() IS
  'FASE 4: notifica admin E master sobre metas em risco, metas atrasadas e obras atrasadas';
