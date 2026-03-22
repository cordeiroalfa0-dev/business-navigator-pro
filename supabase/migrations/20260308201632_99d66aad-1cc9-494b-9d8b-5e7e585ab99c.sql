
-- Check-ins table: weekly/daily progress snapshots with comments
CREATE TABLE public.meta_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id uuid NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  valor_anterior numeric NOT NULL DEFAULT 0,
  valor_novo numeric NOT NULL DEFAULT 0,
  comentario text,
  confianca text NOT NULL DEFAULT 'no_prazo' CHECK (confianca IN ('no_prazo', 'atencao', 'em_risco')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_checkins ENABLE ROW LEVEL SECURITY;

-- All authenticated can view check-ins
CREATE POLICY "Authenticated users can view checkins"
  ON public.meta_checkins FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own check-ins
CREATE POLICY "Users can insert own checkins"
  ON public.meta_checkins FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins/masters can delete check-ins
CREATE POLICY "Editors can delete checkins"
  ON public.meta_checkins FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- Add parent_id for cascading goals (parent-child)
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.metas(id) ON DELETE SET NULL;

-- Add cycle column for goal periods
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS ciclo text NOT NULL DEFAULT 'Q1 2026';

-- Add status column for RAG status
ALTER TABLE public.metas ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'no_prazo' CHECK (status IN ('no_prazo', 'atencao', 'em_risco', 'atingida'));

-- Enable realtime for check-ins
ALTER PUBLICATION supabase_realtime ADD TABLE public.meta_checkins;
