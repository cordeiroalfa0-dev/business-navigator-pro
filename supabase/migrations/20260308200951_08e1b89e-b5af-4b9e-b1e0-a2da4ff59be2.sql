
-- Table to log generated reports
CREATE TABLE public.relatorios_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL DEFAULT '',
  tipo text NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  formato text NOT NULL DEFAULT 'pdf',
  registros integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.relatorios_gerados ENABLE ROW LEVEL SECURITY;

-- All authenticated can view history
CREATE POLICY "Authenticated users can view relatorios"
  ON public.relatorios_gerados FOR SELECT TO authenticated
  USING (true);

-- Users can insert their own reports
CREATE POLICY "Users can insert own relatorios"
  ON public.relatorios_gerados FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can delete
CREATE POLICY "Admins can delete relatorios"
  ON public.relatorios_gerados FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
