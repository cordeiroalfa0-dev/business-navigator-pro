-- ============================================================
-- MÓDULO ALMOXARIFADO — Controle de Ativos com Fotos e Envios
-- Integração do sistema legado ao San Remo ERP
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensão necessária (provavelmente já existe)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA: ativos_remo (materiais com código REMO)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ativos_remo (
  id            uuid        NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_remo   text        UNIQUE NOT NULL,
  nome          text        NOT NULL,
  descricao     text,
  destino       text        NOT NULL DEFAULT 'Almoxarifado',
  quantidade    integer     NOT NULL DEFAULT 1,
  categoria     text,
  usuario_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ativos_remo_destino     ON public.ativos_remo (destino);
CREATE INDEX IF NOT EXISTS idx_ativos_remo_codigo      ON public.ativos_remo (codigo_remo);
CREATE INDEX IF NOT EXISTS idx_ativos_remo_created_at  ON public.ativos_remo (created_at DESC);

-- ============================================================
-- TABELA: ativos_fotos (fotos vinculadas a ativos)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ativos_fotos (
  id            uuid        NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo_id      uuid        NOT NULL REFERENCES public.ativos_remo(id) ON DELETE CASCADE,
  url_imagem    text        NOT NULL,
  nome_arquivo  text        NOT NULL,
  tamanho       integer,
  ordem         integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ativos_fotos_ativo_id ON public.ativos_fotos (ativo_id);

-- ============================================================
-- TABELA: ativos_envios (histórico de transferências)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ativos_envios (
  id            uuid        NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  ativo_id      uuid        NOT NULL REFERENCES public.ativos_remo(id) ON DELETE CASCADE,
  origem        text        NOT NULL,
  destino       text        NOT NULL,
  quantidade    integer     NOT NULL,
  observacao    text,
  usuario_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ativos_envios_ativo_id   ON public.ativos_envios (ativo_id);
CREATE INDEX IF NOT EXISTS idx_ativos_envios_created_at ON public.ativos_envios (created_at DESC);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.ativos_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ativos_remo_updated_at ON public.ativos_remo;
CREATE TRIGGER trg_ativos_remo_updated_at
  BEFORE UPDATE ON public.ativos_remo
  FOR EACH ROW EXECUTE FUNCTION public.ativos_set_updated_at();

-- ============================================================
-- FUNÇÃO: gerar próximo código REMO
-- ============================================================
CREATE OR REPLACE FUNCTION public.gerar_proximo_codigo_remo()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  ultimo_numero integer;
  proximo_codigo text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(codigo_remo FROM 5) AS integer)), 0)
    INTO ultimo_numero
    FROM public.ativos_remo
   WHERE codigo_remo ~ '^REMO[0-9]+$';

  proximo_codigo := 'REMO' || LPAD((ultimo_numero + 1)::text, 4, '0');
  RETURN proximo_codigo;
END;
$$;

-- ============================================================
-- RLS — authenticated users podem ler; admin/master podem escrever
-- ============================================================
ALTER TABLE public.ativos_remo  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos_envios ENABLE ROW LEVEL SECURITY;

-- ativos_remo: leitura para todos autenticados
DROP POLICY IF EXISTS "ativos_remo_select" ON public.ativos_remo;
CREATE POLICY "ativos_remo_select" ON public.ativos_remo
  FOR SELECT TO authenticated USING (true);

-- ativos_remo: escrita para admin/master
DROP POLICY IF EXISTS "ativos_remo_write" ON public.ativos_remo;
CREATE POLICY "ativos_remo_write" ON public.ativos_remo
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

-- ativos_fotos: leitura para todos
DROP POLICY IF EXISTS "ativos_fotos_select" ON public.ativos_fotos;
CREATE POLICY "ativos_fotos_select" ON public.ativos_fotos
  FOR SELECT TO authenticated USING (true);

-- ativos_fotos: escrita para admin/master
DROP POLICY IF EXISTS "ativos_fotos_write" ON public.ativos_fotos;
CREATE POLICY "ativos_fotos_write" ON public.ativos_fotos
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

-- ativos_envios: leitura para todos
DROP POLICY IF EXISTS "ativos_envios_select" ON public.ativos_envios;
CREATE POLICY "ativos_envios_select" ON public.ativos_envios
  FOR SELECT TO authenticated USING (true);

-- ativos_envios: escrita para admin/master
DROP POLICY IF EXISTS "ativos_envios_write" ON public.ativos_envios;
CREATE POLICY "ativos_envios_write" ON public.ativos_envios
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

-- ============================================================
-- STORAGE — bucket fotos-materiais (público para leitura)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fotos-materiais', 'fotos-materiais', true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: upload apenas para admin/master
DROP POLICY IF EXISTS "ativos_fotos_upload" ON storage.objects;
CREATE POLICY "ativos_fotos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-materiais'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

-- Política: leitura pública (bucket é público)
DROP POLICY IF EXISTS "ativos_fotos_public_read" ON storage.objects;
CREATE POLICY "ativos_fotos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-materiais');

-- Política: delete para admin/master
DROP POLICY IF EXISTS "ativos_fotos_delete" ON storage.objects;
CREATE POLICY "ativos_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-materiais'
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'master')
    )
  );

-- ============================================================
-- TABELA: ativos_destinos (destinos personalizáveis)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ativos_destinos (
  id         uuid        NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome       text        NOT NULL UNIQUE,
  ativo      boolean     NOT NULL DEFAULT true,
  padrao     boolean     NOT NULL DEFAULT false,
  created_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ativos_destinos_ativo ON public.ativos_destinos (ativo);

ALTER TABLE public.ativos_destinos ENABLE ROW LEVEL SECURITY;

-- Todos autenticados leem
DROP POLICY IF EXISTS "ativos_destinos_select" ON public.ativos_destinos;
CREATE POLICY "ativos_destinos_select" ON public.ativos_destinos
  FOR SELECT TO authenticated USING (true);

-- Admin/master criam e editam
DROP POLICY IF EXISTS "ativos_destinos_write" ON public.ativos_destinos;
CREATE POLICY "ativos_destinos_write" ON public.ativos_destinos
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','master')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','master')
  ));

-- Seed dos 4 destinos padrão
INSERT INTO public.ativos_destinos (nome, padrao) VALUES
  ('Almoxarifado',   true),
  ('Palazzo Lumini', true),
  ('Queen Victoria', true),
  ('Chateau Carmelo',true)
ON CONFLICT (nome) DO NOTHING;
