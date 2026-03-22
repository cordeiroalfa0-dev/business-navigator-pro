-- ============================================================
-- Adiciona responsavel_id (uuid) na tabela metas
-- Permite filtrar metas por usuário de forma confiável
-- O campo responsavel (texto) continua existindo para compatibilidade
-- ============================================================

ALTER TABLE public.metas
  ADD COLUMN IF NOT EXISTS responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_metas_responsavel_id ON public.metas(responsavel_id);

-- Comentário
COMMENT ON COLUMN public.metas.responsavel_id IS
  'ID do usuário responsável — usado para filtrar metas no Meu Espaço';
