-- ============================================================
-- FASE 1-4: SQL de suporte às melhorias
-- Executar no Supabase Dashboard > SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- FASE 2: Status preditivo automático via trigger
-- Quando uma meta é atualizada, verifica prazo vencido e
-- força status "em_risco" automaticamente no banco.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_auto_status_preditivo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Só age em metas quantitativas com prazo definido
  IF NEW.prazo IS NOT NULL
     AND NEW.tipo_meta IS DISTINCT FROM 'qualitativa'
     AND NEW.unidade IS DISTINCT FROM 'texto'
     AND NEW.status IS DISTINCT FROM 'atingida'
  THEN
    -- Prazo vencido e meta não atingida → em_risco automático
    IF NEW.prazo::date < CURRENT_DATE
       AND (NEW.objetivo = 0 OR (NEW.atual / NULLIF(NEW.objetivo, 0)) < 1)
    THEN
      NEW.status := 'em_risco';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger anterior se existir
DROP TRIGGER IF EXISTS trg_auto_status_preditivo ON public.metas;

-- Cria o trigger BEFORE UPDATE/INSERT
CREATE TRIGGER trg_auto_status_preditivo
  BEFORE INSERT OR UPDATE OF atual, objetivo, prazo, status
  ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_status_preditivo();

-- ─────────────────────────────────────────────────────────────
-- FASE 2: Toggle de conclusão para metas qualitativas
-- A coluna tipo_meta já deve existir; garantimos o check constraint.
-- ─────────────────────────────────────────────────────────────

-- Garante que tipo_meta aceita os dois valores esperados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'metas_tipo_meta_check'
  ) THEN
    ALTER TABLE public.metas
      ADD CONSTRAINT metas_tipo_meta_check
      CHECK (tipo_meta IN ('quantitativa', 'qualitativa'));
  END IF;
END $$;

-- Garante que prazo existe na tabela metas (pode já existir)
ALTER TABLE public.metas
  ADD COLUMN IF NOT EXISTS prazo date;

-- ─────────────────────────────────────────────────────────────
-- FASE 3: Índice para acelerar o mapa de saúde por categoria
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_metas_categoria_status
  ON public.metas (categoria, status)
  WHERE categoria IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- FASE 4: View para progresso sugerido por obra
-- Calcula automaticamente o % de metas atingidas por obra.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.v_progresso_obras_por_metas AS
SELECT
  obra_id,
  COUNT(*)                                                          AS total_metas,
  COUNT(*) FILTER (WHERE status = 'atingida')                       AS metas_atingidas,
  COUNT(*) FILTER (WHERE status = 'em_risco')                       AS metas_em_risco,
  CASE
    WHEN COUNT(*) = 0 THEN 0
    ELSE ROUND(
      COUNT(*) FILTER (WHERE status = 'atingida')::numeric
      / COUNT(*)::numeric * 100
    )
  END                                                               AS progresso_sugerido_pct
FROM public.metas
WHERE obra_id IS NOT NULL
GROUP BY obra_id;

-- Garante que a view é acessível para usuários autenticados
GRANT SELECT ON public.v_progresso_obras_por_metas TO authenticated;

-- ─────────────────────────────────────────────────────────────
-- FASE 4: Trigger para recalcular automaticamente progresso
-- da execucao_obra quando uma meta vinculada é atualizada.
-- (Opcional — o recálculo manual pelo botão já funciona sem isso)
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.fn_recalcular_progresso_obra()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_obra_id   uuid;
  v_total     int;
  v_atingidas int;
  v_pct       int;
BEGIN
  -- Pega o obra_id da meta que foi alterada
  v_obra_id := COALESCE(NEW.obra_id, OLD.obra_id);
  IF v_obra_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Calcula o progresso
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'atingida')
  INTO v_total, v_atingidas
  FROM public.metas
  WHERE obra_id = v_obra_id;

  IF v_total > 0 THEN
    v_pct := ROUND(v_atingidas::numeric / v_total::numeric * 100);
    -- Atualiza o campo progresso na execucao_obras
    UPDATE public.execucao_obras
    SET progresso = v_pct
    WHERE id = v_obra_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ⚠️  Este trigger é OPCIONAL e aplica recálculo automático no banco.
-- Se preferir manter o controle manual via botão na UI, comente as linhas abaixo.
-- DROP TRIGGER IF EXISTS trg_recalcular_progresso_obra ON public.metas;
-- CREATE TRIGGER trg_recalcular_progresso_obra
--   AFTER INSERT OR UPDATE OF status OR DELETE
--   ON public.metas
--   FOR EACH ROW
--   EXECUTE FUNCTION public.fn_recalcular_progresso_obra();

-- ─────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL
-- ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE '✅ FASE1-4: Migrations aplicadas com sucesso!';
  RAISE NOTICE '  • Trigger de status preditivo (prazo vencido → em_risco) criado';
  RAISE NOTICE '  • Índice de categoria+status criado para mapa de saúde';
  RAISE NOTICE '  • View v_progresso_obras_por_metas criada';
  RAISE NOTICE '  • Trigger de recálculo automático comentado (ativar se desejado)';
END $$;
