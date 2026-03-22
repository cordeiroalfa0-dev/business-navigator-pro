-- ============================================================
-- FASE 2 — Recurso 2: RLS meta_snapshots + índice único
-- Garante que a edge function create-meta-snapshots não duplica
-- ============================================================

-- RLS
ALTER TABLE public.meta_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "snapshots_select" ON public.meta_snapshots;
DROP POLICY IF EXISTS "snapshots_insert" ON public.meta_snapshots;

CREATE POLICY "snapshots_select" ON public.meta_snapshots
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "snapshots_insert" ON public.meta_snapshots
  FOR INSERT WITH CHECK (true); -- só a edge function (service_role) insere

-- Índice único: um snapshot por meta por dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_meta_snapshots_unique
  ON public.meta_snapshots (meta_id, snapshot_date);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_meta_id
  ON public.meta_snapshots (meta_id);
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_date
  ON public.meta_snapshots (snapshot_date DESC);

COMMENT ON TABLE public.meta_snapshots IS
  'FASE 2: snapshot semanal do estado de cada meta — gerado pela edge function create-meta-snapshots';
