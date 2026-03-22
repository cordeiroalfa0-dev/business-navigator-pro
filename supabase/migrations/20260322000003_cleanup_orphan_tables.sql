-- ============================================================
-- Cleanup: tabelas criadas mas nunca utilizadas no frontend.
-- Execute APENAS se tiver certeza que não há dados relevantes.
-- ============================================================

-- meta_checkins_v2: nunca usada (app usa meta_checkins v1)
-- Descomente quando confirmar que não há dados:
-- DROP TABLE IF EXISTS public.meta_checkins_v2;

-- meta_predictions: tabela criada mas sem chamadas no frontend
-- DROP TABLE IF EXISTS public.meta_predictions;

-- meta_dependencies: tabela criada mas sem chamadas no frontend
-- DROP TABLE IF EXISTS public.meta_dependencies;

-- RECOMENDAÇÃO SEGURA: manter as tabelas comentadas acima por ora.
-- Antes de remover, verifique com:
--   SELECT COUNT(*) FROM meta_checkins_v2;
--   SELECT COUNT(*) FROM meta_predictions;
--   SELECT COUNT(*) FROM meta_dependencies;
-- Se todas retornarem 0, pode executar os DROPs.

-- O que fazer com meta_checkins_v2:
-- Opção A) Migrar app para usar v2 (tem mais campos: evidencia_urls, tags)
-- Opção B) Dropar v2 e manter v1
-- Opção C) Fazer merge: adicionar colunas faltantes na v1 e dropar v2

-- Sugestão de merge (adiciona campos da v2 na v1):
ALTER TABLE public.meta_checkins
  ADD COLUMN IF NOT EXISTS evidencia_urls text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];
