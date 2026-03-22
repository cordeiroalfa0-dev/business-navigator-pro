-- ============================================================
-- Unificação: adiciona colunas da v2 na v1 e remove v2
-- Assim o MetaCheckInModal e Metas.tsx usam a mesma tabela
-- ============================================================

-- Adicionar colunas extras da v2 na v1 (se não existirem)
ALTER TABLE public.meta_checkins
  ADD COLUMN IF NOT EXISTS evidencia_urls  text[]  DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS tags            text[]  DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS percentual_novo numeric DEFAULT NULL;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_meta_checkins_meta_id_created
  ON public.meta_checkins (meta_id, created_at DESC);

-- Remover v2 apenas se estiver vazia (seguro)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.meta_checkins_v2) = 0 THEN
    DROP TABLE IF EXISTS public.meta_checkins_v2;
    RAISE NOTICE 'meta_checkins_v2 removida (estava vazia)';
  ELSE
    RAISE NOTICE 'meta_checkins_v2 mantida pois contém % registros — migre manualmente',
      (SELECT COUNT(*) FROM public.meta_checkins_v2);
  END IF;
END $$;
