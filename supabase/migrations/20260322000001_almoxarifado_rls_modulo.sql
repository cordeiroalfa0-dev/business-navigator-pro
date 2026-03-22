-- ============================================================
-- ALMOXARIFADO — Expansão de RLS para usuários do módulo
-- Problema: as políticas de escrita anteriores bloqueavam no
-- banco qualquer usuário com role 'normal', mesmo que o admin
-- tivesse habilitado o módulo 'almoxarifado' para ele via
-- user_module_permissions. O frontend liberava os botões mas
-- o Supabase rejeitava silenciosamente todas as operações.
--
-- Solução: criar função auxiliar is_almoxarife() e recriar
-- todas as políticas de escrita incluindo essa condição.
--
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ============================================================
-- FUNÇÃO AUXILIAR: verifica se o usuário pode operar o almoxarifado
-- Retorna true para: admin, master, ou normal com módulo habilitado
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_almoxarife()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'master')
  )
  OR EXISTS (
    SELECT 1 FROM public.user_module_permissions ump
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    WHERE ump.user_id    = auth.uid()
      AND ump.module_key = 'almoxarifado'
      AND ump.enabled    = true
      AND ur.role        = 'normal'
  );
$$;

-- ============================================================
-- ativos_remo — recriar política de escrita
-- ============================================================
DROP POLICY IF EXISTS "ativos_remo_write" ON public.ativos_remo;
CREATE POLICY "ativos_remo_write" ON public.ativos_remo
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ============================================================
-- ativos_fotos — recriar política de escrita
-- ============================================================
DROP POLICY IF EXISTS "ativos_fotos_write" ON public.ativos_fotos;
CREATE POLICY "ativos_fotos_write" ON public.ativos_fotos
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ============================================================
-- ativos_envios — recriar política de escrita
-- ============================================================
DROP POLICY IF EXISTS "ativos_envios_write" ON public.ativos_envios;
CREATE POLICY "ativos_envios_write" ON public.ativos_envios
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ============================================================
-- ativos_destinos — recriar política de escrita
-- ============================================================
DROP POLICY IF EXISTS "ativos_destinos_write" ON public.ativos_destinos;
CREATE POLICY "ativos_destinos_write" ON public.ativos_destinos
  FOR ALL TO authenticated
  USING      (public.is_almoxarife())
  WITH CHECK (public.is_almoxarife());

-- ============================================================
-- storage.objects (bucket fotos-materiais) — upload e delete
-- ============================================================
DROP POLICY IF EXISTS "ativos_fotos_upload" ON storage.objects;
CREATE POLICY "ativos_fotos_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'fotos-materiais'
    AND public.is_almoxarife()
  );

DROP POLICY IF EXISTS "ativos_fotos_delete" ON storage.objects;
CREATE POLICY "ativos_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'fotos-materiais'
    AND public.is_almoxarife()
  );

-- ============================================================
-- app_modules — garantir que 'almoxarifado' existe e está
-- visível para ser habilitado por usuário
-- ============================================================
INSERT INTO public.app_modules (key, label, enabled)
VALUES ('almoxarifado', 'Almoxarifado', true)
ON CONFLICT (key) DO UPDATE SET
  label   = EXCLUDED.label,
  enabled = true;         -- garante que o módulo global está ativo

-- ============================================================
-- VERIFICAÇÃO (opcional — rode para confirmar)
-- SELECT public.is_almoxarife();  -- deve retornar true para o almoxarife
-- SELECT * FROM public.app_modules WHERE key = 'almoxarifado';
-- SELECT * FROM public.user_module_permissions WHERE module_key = 'almoxarifado';
-- ============================================================
