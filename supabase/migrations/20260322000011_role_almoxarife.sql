-- ============================================================
-- Adiciona role "almoxarife" ao sistema
-- Almoxarife: acesso exclusivo ao módulo Almoxarifado + Meu Espaço
-- ============================================================

-- Adicionar novo valor ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'almoxarife';

-- Comentário
COMMENT ON TYPE public.app_role IS
  'Papéis do sistema: admin (total), master (gerencia metas), normal (visualização), almoxarife (só almoxarifado)';
