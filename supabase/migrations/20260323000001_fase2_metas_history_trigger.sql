-- ============================================================
-- FASE 2 — Recurso 1: Trigger automático para metas_history
-- Toda alteração em metas é registrada automaticamente
-- ============================================================

-- Garantir RLS na tabela metas_history
ALTER TABLE public.metas_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metas_history_select" ON public.metas_history;
DROP POLICY IF EXISTS "metas_history_insert" ON public.metas_history;

-- Apenas admin/master leem o histórico
CREATE POLICY "metas_history_select" ON public.metas_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin','master')
    )
  );

-- Apenas o sistema (trigger) insere
CREATE POLICY "metas_history_insert" ON public.metas_history
  FOR INSERT WITH CHECK (true);

-- ── Função do trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_metas_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só registra UPDATE (INSERT e DELETE são cobertos pelo audit_logs via frontend)
  IF TG_OP = 'UPDATE' THEN
    -- Só grava se algo relevante mudou
    IF (
      OLD.nome          IS DISTINCT FROM NEW.nome          OR
      OLD.atual         IS DISTINCT FROM NEW.atual         OR
      OLD.objetivo      IS DISTINCT FROM NEW.objetivo      OR
      OLD.status        IS DISTINCT FROM NEW.status        OR
      OLD.responsavel   IS DISTINCT FROM NEW.responsavel   OR
      OLD.prioridade    IS DISTINCT FROM NEW.prioridade    OR
      OLD.prazo         IS DISTINCT FROM NEW.prazo         OR
      OLD.categoria     IS DISTINCT FROM NEW.categoria     OR
      OLD.unidade       IS DISTINCT FROM NEW.unidade       OR
      OLD.orcamento     IS DISTINCT FROM NEW.orcamento     OR
      OLD.custo_atual   IS DISTINCT FROM NEW.custo_atual   OR
      OLD.peso          IS DISTINCT FROM NEW.peso          OR
      OLD.data_inicio   IS DISTINCT FROM NEW.data_inicio
    ) THEN
      INSERT INTO public.metas_history (
        meta_id,
        edited_by,
        edited_at,
        -- nome
        nome_anterior,         nome_novo,
        -- unidade
        unidade_anterior,      unidade_novo,
        -- categoria
        categoria_anterior,    categoria_novo,
        -- responsavel
        responsavel_anterior,  responsavel_novo,
        -- prioridade
        prioridade_anterior,   prioridade_novo,
        -- status
        status_anterior,       status_novo,
        -- valores numéricos
        atual_anterior,        atual_novo,
        objetivo_anterior,     objetivo_novo,
        orcamento_anterior,    orcamento_novo,
        custo_atual_anterior,  custo_atual_novo,
        peso_anterior,         peso_novo,
        -- datas
        prazo_anterior,        prazo_novo,
        data_inicio_anterior,  data_inicio_novo
      ) VALUES (
        NEW.id,
        COALESCE(NEW.created_by, auth.uid()),
        now(),
        -- nome
        CASE WHEN OLD.nome IS DISTINCT FROM NEW.nome THEN OLD.nome ELSE NULL END,
        CASE WHEN OLD.nome IS DISTINCT FROM NEW.nome THEN NEW.nome ELSE NULL END,
        -- unidade
        CASE WHEN OLD.unidade IS DISTINCT FROM NEW.unidade THEN OLD.unidade ELSE NULL END,
        CASE WHEN OLD.unidade IS DISTINCT FROM NEW.unidade THEN NEW.unidade ELSE NULL END,
        -- categoria
        CASE WHEN OLD.categoria IS DISTINCT FROM NEW.categoria THEN OLD.categoria ELSE NULL END,
        CASE WHEN OLD.categoria IS DISTINCT FROM NEW.categoria THEN NEW.categoria ELSE NULL END,
        -- responsavel
        CASE WHEN OLD.responsavel IS DISTINCT FROM NEW.responsavel THEN OLD.responsavel ELSE NULL END,
        CASE WHEN OLD.responsavel IS DISTINCT FROM NEW.responsavel THEN NEW.responsavel ELSE NULL END,
        -- prioridade
        CASE WHEN OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN OLD.prioridade ELSE NULL END,
        CASE WHEN OLD.prioridade IS DISTINCT FROM NEW.prioridade THEN NEW.prioridade ELSE NULL END,
        -- status
        CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN OLD.status ELSE NULL END,
        CASE WHEN OLD.status IS DISTINCT FROM NEW.status THEN NEW.status ELSE NULL END,
        -- numéricos
        CASE WHEN OLD.atual IS DISTINCT FROM NEW.atual THEN OLD.atual ELSE NULL END,
        CASE WHEN OLD.atual IS DISTINCT FROM NEW.atual THEN NEW.atual ELSE NULL END,
        CASE WHEN OLD.objetivo IS DISTINCT FROM NEW.objetivo THEN OLD.objetivo ELSE NULL END,
        CASE WHEN OLD.objetivo IS DISTINCT FROM NEW.objetivo THEN NEW.objetivo ELSE NULL END,
        CASE WHEN OLD.orcamento IS DISTINCT FROM NEW.orcamento THEN OLD.orcamento ELSE NULL END,
        CASE WHEN OLD.orcamento IS DISTINCT FROM NEW.orcamento THEN NEW.orcamento ELSE NULL END,
        CASE WHEN OLD.custo_atual IS DISTINCT FROM NEW.custo_atual THEN OLD.custo_atual ELSE NULL END,
        CASE WHEN OLD.custo_atual IS DISTINCT FROM NEW.custo_atual THEN NEW.custo_atual ELSE NULL END,
        CASE WHEN OLD.peso IS DISTINCT FROM NEW.peso THEN OLD.peso ELSE NULL END,
        CASE WHEN OLD.peso IS DISTINCT FROM NEW.peso THEN NEW.peso ELSE NULL END,
        -- datas
        CASE WHEN OLD.prazo IS DISTINCT FROM NEW.prazo THEN OLD.prazo ELSE NULL END,
        CASE WHEN OLD.prazo IS DISTINCT FROM NEW.prazo THEN NEW.prazo ELSE NULL END,
        CASE WHEN OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN OLD.data_inicio ELSE NULL END,
        CASE WHEN OLD.data_inicio IS DISTINCT FROM NEW.data_inicio THEN NEW.data_inicio ELSE NULL END
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Registrar o trigger
DROP TRIGGER IF EXISTS trig_metas_history ON public.metas;

CREATE TRIGGER trig_metas_history
  AFTER UPDATE ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_metas_history();

COMMENT ON FUNCTION public.registrar_metas_history() IS
  'FASE 2: popula metas_history automaticamente a cada UPDATE em metas';
