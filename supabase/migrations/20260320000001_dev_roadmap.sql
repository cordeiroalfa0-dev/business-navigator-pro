-- ============================================================
-- DEV ROADMAP — Área de Desenvolvimento (Admin)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dev_roadmap (
  id          uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  descricao   text,
  categoria   text NOT NULL DEFAULT 'feature',   -- 'feature' | 'melhoria' | 'correcao' | 'integracao'
  prioridade  text NOT NULL DEFAULT 'media',      -- 'baixa' | 'media' | 'alta' | 'critica'
  status      text NOT NULL DEFAULT 'planejado',  -- 'planejado' | 'em_andamento' | 'concluido' | 'cancelado'
  previsao    text,                               -- texto livre, ex: "Q2 2026" ou "Abril"
  ordem       integer NOT NULL DEFAULT 0,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dev_roadmap_status   ON public.dev_roadmap (status);
CREATE INDEX IF NOT EXISTS idx_dev_roadmap_ordem    ON public.dev_roadmap (ordem);
CREATE INDEX IF NOT EXISTS idx_dev_roadmap_created  ON public.dev_roadmap (created_at DESC);

-- RLS — só admin lê e escreve
ALTER TABLE public.dev_roadmap ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_roadmap_admin_all" ON public.dev_roadmap;
CREATE POLICY "dev_roadmap_admin_all" ON public.dev_roadmap
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_dev_roadmap_updated_at ON public.dev_roadmap;
CREATE TRIGGER trg_dev_roadmap_updated_at
  BEFORE UPDATE ON public.dev_roadmap
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SEED: itens iniciais do roadmap
-- ============================================================
INSERT INTO public.dev_roadmap (titulo, descricao, categoria, prioridade, status, previsao, ordem)
VALUES (
  'Módulo Almoxarifado',
  'Controle de ativos físicos com código REMO, upload de fotos, transferência entre destinos (Almoxarifado, Palazzo Lumini, Queen Victoria, Chateau Carmelo) e histórico completo de movimentações. Código completo incluído em src/pages/Almoxarifado.tsx.',
  'feature',
  'alta',
  'planejado',
  'Q2 2026',
  0
)
ON CONFLICT DO NOTHING;
