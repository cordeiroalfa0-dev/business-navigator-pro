-- ============================================================
-- FASE 5 — Diário de Obra (RDO)
-- Tabela principal + itens de efetivo + RLS
-- ============================================================

-- ── Tabela principal ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diario_obra (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id          uuid        REFERENCES public.execucao_obras(id) ON DELETE CASCADE,
  obra_nome        text        NOT NULL DEFAULT '',
  data_registro    date        NOT NULL DEFAULT current_date,
  -- Condições climáticas
  clima_manha      text        DEFAULT 'bom',      -- bom, nublado, chuvoso, chuva_forte, tempestade
  clima_tarde      text        DEFAULT 'bom',
  temperatura_max  numeric(4,1),
  temperatura_min  numeric(4,1),
  -- Efetivo
  total_trabalhadores int      DEFAULT 0,
  horas_trabalhadas   numeric(5,1) DEFAULT 0,
  -- Conteúdo do RDO
  atividades_dia   text        NOT NULL DEFAULT '',
  ocorrencias      text,
  equipamentos     text,
  materiais_usados text,
  observacoes      text,
  -- Fotos (URLs do storage)
  fotos            text[]      DEFAULT '{}',
  -- Controle
  created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  aprovado_por     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  aprovado_em      timestamptz,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── Tabela de efetivo detalhado ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.diario_obra_efetivo (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  diario_id    uuid    NOT NULL REFERENCES public.diario_obra(id) ON DELETE CASCADE,
  funcao       text    NOT NULL,
  quantidade   int     NOT NULL DEFAULT 0,
  horas        numeric(5,1) DEFAULT 8,
  empresa      text,
  created_at   timestamptz DEFAULT now()
);

-- ── Índices ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_diario_obra_obra_id    ON public.diario_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_diario_obra_data       ON public.diario_obra(data_registro DESC);
CREATE INDEX IF NOT EXISTS idx_diario_obra_created_by ON public.diario_obra(created_by);
CREATE INDEX IF NOT EXISTS idx_diario_efetivo_diario  ON public.diario_obra_efetivo(diario_id);

-- ── Trigger updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_diario_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trig_diario_updated_at ON public.diario_obra;
CREATE TRIGGER trig_diario_updated_at
  BEFORE UPDATE ON public.diario_obra
  FOR EACH ROW EXECUTE FUNCTION public.set_diario_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.diario_obra          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_obra_efetivo  ENABLE ROW LEVEL SECURITY;

-- diario_obra: autenticados leem, admin/master criam/editam/deletam
CREATE POLICY "diario_select" ON public.diario_obra
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "diario_insert" ON public.diario_obra
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','master'))
  );

CREATE POLICY "diario_update" ON public.diario_obra
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','master'))
    OR created_by = auth.uid()
  );

CREATE POLICY "diario_delete" ON public.diario_obra
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','master'))
  );

-- diario_obra_efetivo: mesmas regras
CREATE POLICY "efetivo_select" ON public.diario_obra_efetivo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "efetivo_insert" ON public.diario_obra_efetivo
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "efetivo_update" ON public.diario_obra_efetivo
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "efetivo_delete" ON public.diario_obra_efetivo
  FOR DELETE USING (auth.role() = 'authenticated');

-- ── Storage bucket para fotos do diário ──────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('diario-fotos', 'diario-fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "diario_fotos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'diario-fotos');

CREATE POLICY "diario_fotos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'diario-fotos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "diario_fotos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'diario-fotos' AND auth.role() = 'authenticated'
  );

COMMENT ON TABLE public.diario_obra IS
  'FASE 5: Diário de Obra (RDO) — registro diário vinculado a execucao_obras';
COMMENT ON TABLE public.diario_obra_efetivo IS
  'FASE 5: Efetivo detalhado por função para cada diário de obra';

-- ── Seed: adicionar item no roadmap de desenvolvimento ───────────────────
-- (só insere se não existir com este título)
INSERT INTO public.dev_roadmap (titulo, descricao, categoria, prioridade, status, previsao, ordem)
SELECT
  'Diário de Obra (RDO)',
  'Registro diário de atividades, efetivo, clima, ocorrências e fotos vinculado à Execução de Obra. Exportável como PDF no padrão RDO. Tabelas: diario_obra + diario_obra_efetivo + bucket diario-fotos.',
  'feature',
  'alta',
  'planejado',
  'Q2 2026',
  COALESCE((SELECT MAX(ordem) + 1 FROM public.dev_roadmap), 0)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dev_roadmap WHERE titulo = 'Diário de Obra (RDO)'
);
