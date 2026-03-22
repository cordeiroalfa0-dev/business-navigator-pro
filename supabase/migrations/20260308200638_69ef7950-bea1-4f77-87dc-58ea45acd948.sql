
-- Allow normal users to insert acoes_meta (their contributions)
DROP POLICY "Admin and master can insert acoes" ON public.acoes_meta;
CREATE POLICY "Authenticated users can insert acoes"
  ON public.acoes_meta FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow normal users to update their own acoes (mark as done)
DROP POLICY "Admin and master can update acoes" ON public.acoes_meta;
CREATE POLICY "Authenticated users can update acoes"
  ON public.acoes_meta FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add created_by column to track who added the action
ALTER TABLE public.acoes_meta ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add tipo column to distinguish editor actions vs user contributions
ALTER TABLE public.acoes_meta ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'acao' CHECK (tipo IN ('acao', 'contribuicao'));
