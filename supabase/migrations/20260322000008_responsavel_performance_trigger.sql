-- ============================================================
-- Trigger: atualiza responsavel_performance automaticamente
-- Dispara toda vez que uma meta é inserida ou atualizada.
-- ============================================================

CREATE OR REPLACE FUNCTION public.atualizar_responsavel_performance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_mes_ano     text    := to_char(now(), 'YYYY-MM');
  v_user_id     uuid;
  v_user_name   text;
  v_total       int     := 0;
  v_concluidas  int     := 0;
  v_no_prazo    int     := 0;
  v_atrasadas   int     := 0;
  v_taxa        numeric := 0;
  v_pontos      int     := 0;
BEGIN
  v_user_id := COALESCE(NEW.created_by, OLD.created_by);
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  -- Nome real do perfil
  SELECT full_name INTO v_user_name
    FROM public.profiles WHERE id = v_user_id;

  -- Total de metas do usuário
  SELECT COUNT(*) INTO v_total
    FROM public.metas
   WHERE created_by = v_user_id AND is_deleted IS NOT TRUE;

  -- Metas atingidas
  SELECT COUNT(*) INTO v_concluidas
    FROM public.metas
   WHERE created_by = v_user_id
     AND is_deleted IS NOT TRUE
     AND status = 'atingida';

  -- Metas no prazo
  SELECT COUNT(*) INTO v_no_prazo
    FROM public.metas
   WHERE created_by = v_user_id
     AND is_deleted IS NOT TRUE
     AND status = 'no_prazo';

  -- Metas atrasadas (em risco ou atenção com prazo vencido)
  SELECT COUNT(*) INTO v_atrasadas
    FROM public.metas
   WHERE created_by = v_user_id
     AND is_deleted IS NOT TRUE
     AND status IN ('em_risco', 'atencao')
     AND prazo IS NOT NULL
     AND prazo::date < current_date;

  -- Taxa de sucesso
  IF v_total > 0 THEN
    v_taxa := ROUND(((v_concluidas + v_no_prazo)::numeric / v_total) * 100, 1);
  END IF;

  -- Pontuação gamificação
  v_pontos := GREATEST((v_concluidas * 10) + (v_no_prazo * 5) - (v_atrasadas * 3), 0);

  -- Upsert
  INSERT INTO public.responsavel_performance
    (user_id, user_name, mes_ano, total_metas, metas_concluidas,
     metas_no_prazo, metas_atrasadas, taxa_sucesso, pontos_gamificacao, updated_at)
  VALUES
    (v_user_id, COALESCE(v_user_name, '—'), v_mes_ano, v_total,
     v_concluidas, v_no_prazo, v_atrasadas, v_taxa, v_pontos, now())
  ON CONFLICT (user_id, mes_ano) DO UPDATE SET
    user_name          = EXCLUDED.user_name,
    total_metas        = EXCLUDED.total_metas,
    metas_concluidas   = EXCLUDED.metas_concluidas,
    metas_no_prazo     = EXCLUDED.metas_no_prazo,
    metas_atrasadas    = EXCLUDED.metas_atrasadas,
    taxa_sucesso       = EXCLUDED.taxa_sucesso,
    pontos_gamificacao = EXCLUDED.pontos_gamificacao,
    updated_at         = now();

  RETURN NEW;
END;
$$;

-- Trigger em metas
DROP TRIGGER IF EXISTS trig_atualizar_performance ON public.metas;

CREATE TRIGGER trig_atualizar_performance
  AFTER INSERT OR UPDATE OF status, atual, objetivo
  ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_responsavel_performance();

GRANT EXECUTE ON FUNCTION public.atualizar_responsavel_performance() TO service_role;
