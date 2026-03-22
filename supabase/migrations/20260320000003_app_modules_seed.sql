-- ============================================================
-- MÓDULOS DO SISTEMA — Seed completo para app_modules
-- Adiciona todos os módulos controláveis, mantendo os existentes
-- Execute no SQL Editor do Supabase
-- ============================================================

INSERT INTO public.app_modules (key, label, enabled)
VALUES
  -- Visão Geral (ativos por padrão)
  ('metas',           'Metas',              true),
  ('execucao',        'Execução de Obra',   true),
  ('relatorios',      'Relatórios',         true),
  -- Análise (ativos por padrão)
  ('ranking',         'Ranking de Equipe',  true),
  ('metas_avancadas', 'Metas Avançadas',    true),
  -- Dados (ativos por padrão, exceto almoxarifado)
  ('cadastro',        'Cadastro de Dados',  true),
  ('importacao',      'Importar Excel',     true),
  ('almoxarifado',    'Almoxarifado',       false),
  -- Módulos (inativos por padrão — requerem configuração)
  ('financeiro',      'Financeiro',         false),
  ('obras',           'Obras',              false)
ON CONFLICT (key) DO NOTHING;
-- ON CONFLICT DO NOTHING preserva qualquer toggle que o admin já tiver feito
