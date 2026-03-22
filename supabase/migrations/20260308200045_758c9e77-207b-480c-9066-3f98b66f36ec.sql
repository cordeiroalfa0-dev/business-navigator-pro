
-- Metas table
CREATE TABLE public.metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  atual numeric NOT NULL DEFAULT 0,
  objetivo numeric NOT NULL,
  unidade text NOT NULL DEFAULT 'R$',
  cor text NOT NULL DEFAULT 'hsl(207, 89%, 48%)',
  categoria text NOT NULL DEFAULT 'Financeiro',
  responsavel text NOT NULL DEFAULT '',
  prazo date NOT NULL DEFAULT (now() + interval '1 year')::date,
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Authenticated users can view metas"
  ON public.metas FOR SELECT TO authenticated
  USING (true);

-- Admin and master can insert
CREATE POLICY "Admin and master can insert metas"
  ON public.metas FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  );

-- Admin and master can update
CREATE POLICY "Admin and master can update metas"
  ON public.metas FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  );

-- Admin and master can delete
CREATE POLICY "Admin and master can delete metas"
  ON public.metas FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  );

-- Action items table for each meta
CREATE TABLE public.acoes_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id uuid REFERENCES public.metas(id) ON DELETE CASCADE NOT NULL,
  descricao text NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  responsavel text,
  prazo date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.acoes_meta ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view
CREATE POLICY "Authenticated users can view acoes"
  ON public.acoes_meta FOR SELECT TO authenticated
  USING (true);

-- Admin and master can insert
CREATE POLICY "Admin and master can insert acoes"
  ON public.acoes_meta FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  );

-- Admin and master can update
CREATE POLICY "Admin and master can update acoes"
  ON public.acoes_meta FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  );

-- Admin and master can delete
CREATE POLICY "Admin and master can delete acoes"
  ON public.acoes_meta FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master')
  );

-- Updated_at trigger for metas
CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.metas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.acoes_meta;
