-- SAN REMO ERP — Initial Schema Migration
-- Generated: 2026-03-15
-- Cria todas as tabelas do banco remoto localmente

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUM: user_role
-- ==========================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'master', 'user', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ==========================================
-- TABELA: profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  role text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: user_roles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  role public.user_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: app_modules
-- ==========================================
CREATE TABLE IF NOT EXISTS public.app_modules (
  key text NOT NULL PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: audit_logs
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_email text,
  user_name text,
  table_name text NOT NULL,
  action text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  changes_summary text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: backup_schedule
-- ==========================================
CREATE TABLE IF NOT EXISTS public.backup_schedule (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_name text NOT NULL,
  frequency text,
  day_of_week integer,
  hour integer,
  minute integer,
  last_backup_at timestamp with time zone,
  next_backup_at timestamp with time zone,
  backup_size_bytes bigint,
  backup_file_url text,
  status text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: admin_notifications
-- ==========================================
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  type text NOT NULL,
  severity text,
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  is_read boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: metas
-- ==========================================
CREATE TABLE IF NOT EXISTS public.metas (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome text NOT NULL,
  atual numeric NOT NULL DEFAULT 0,
  objetivo numeric NOT NULL,
  unidade text NOT NULL,
  cor text NOT NULL,
  categoria text NOT NULL,
  responsavel text NOT NULL,
  prazo date NOT NULL,
  prioridade text NOT NULL,
  ciclo text NOT NULL,
  status text NOT NULL DEFAULT 'no_prazo',
  descricao text,
  local_obra text,
  orcamento numeric,
  custo_atual numeric,
  equipe text,
  fornecedor text,
  etapa text,
  peso numeric,
  tags text[],
  data_inicio date,
  frequencia_checkin text,
  risco text,
  observacoes text,
  aprovador text,
  departamento text,
  tipo_meta text,
  indicador_chave text,
  fonte_dados text,
  impacto text,
  dependencias text,
  marco_critico text,
  percentual_concluido numeric DEFAULT 0,
  parent_id uuid,
  created_by uuid,
  updated_by uuid,
  is_deleted boolean DEFAULT false,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: metas_history
-- ==========================================
CREATE TABLE IF NOT EXISTS public.metas_history (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  edited_by uuid NOT NULL,
  edited_at timestamp with time zone NOT NULL DEFAULT now(),
  motivo_edicao text,
  nome_anterior text, nome_novo text,
  unidade_anterior text, unidade_novo text,
  cor_anterior text, cor_novo text,
  categoria_anterior text, categoria_novo text,
  responsavel_anterior text, responsavel_novo text,
  prioridade_anterior text, prioridade_novo text,
  status_anterior text, status_novo text,
  atual_anterior numeric, atual_novo numeric,
  objetivo_anterior numeric, objetivo_novo numeric,
  prazo_anterior date, prazo_novo date,
  parent_id_anterior uuid, parent_id_novo uuid,
  orcamento_anterior numeric, orcamento_novo numeric,
  custo_atual_anterior numeric, custo_atual_novo numeric,
  peso_anterior numeric, peso_novo numeric,
  data_inicio_anterior date, data_inicio_novo date,
  percentual_concluido_anterior numeric, percentual_concluido_novo numeric,
  descricao_anterior text, descricao_novo text,
  local_obra_anterior text, local_obra_novo text,
  equipe_anterior text, equipe_novo text,
  fornecedor_anterior text, fornecedor_novo text,
  etapa_anterior text, etapa_novo text,
  tags_anterior text[], tags_novo text[],
  frequencia_checkin_anterior text, frequencia_checkin_novo text,
  risco_anterior text, risco_novo text,
  observacoes_anterior text, observacoes_novo text,
  aprovador_anterior text, aprovador_novo text,
  departamento_anterior text, departamento_novo text,
  tipo_meta_anterior text, tipo_meta_novo text,
  indicador_chave_anterior text, indicador_chave_novo text,
  fonte_dados_anterior text, fonte_dados_novo text,
  impacto_anterior text, impacto_novo text,
  dependencias_anterior text, dependencias_novo text,
  marco_critico_anterior text, marco_critico_novo text,
  ciclo_anterior text, ciclo_novo text
);

-- ==========================================
-- TABELA: meta_checkins
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meta_checkins (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  valor_anterior numeric NOT NULL,
  valor_novo numeric NOT NULL,
  confianca text NOT NULL,
  comentario text,
  imagens text[],
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: meta_checkins_v2
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meta_checkins_v2 (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text,
  percentual_anterior numeric,
  percentual_novo numeric NOT NULL,
  comentario text,
  foto_url text,
  evidencia_urls text[],
  tags text[],
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: meta_snapshots
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meta_snapshots (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  nome text NOT NULL,
  atual numeric NOT NULL,
  objetivo numeric NOT NULL,
  percentual_concluido numeric,
  status text,
  responsavel text,
  snapshot_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: meta_predictions
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meta_predictions (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  data_analise date NOT NULL,
  data_estimada_conclusao date,
  dias_atraso_estimado integer,
  velocidade_media numeric,
  confianca_predicao numeric,
  margem_risco text,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: meta_dependencies
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meta_dependencies (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  depends_on_meta_id uuid NOT NULL,
  dependency_type text,
  is_critical boolean DEFAULT false,
  lag_days integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: meta_acoes_kanban
-- ==========================================
CREATE TABLE IF NOT EXISTS public.meta_acoes_kanban (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  titulo text NOT NULL,
  descricao text,
  status text DEFAULT 'todo',
  prioridade text,
  responsavel_id uuid,
  responsavel_nome text,
  ordem integer DEFAULT 0,
  percentual_completo numeric DEFAULT 0,
  tags text[],
  data_inicio date,
  data_vencimento date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ==========================================
-- TABELA: acoes_meta
-- ==========================================
CREATE TABLE IF NOT EXISTS public.acoes_meta (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  meta_id uuid NOT NULL,
  descricao text NOT NULL,
  tipo text NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  responsavel text,
  prazo date,
  imagens text[],
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: dados_cadastro
-- ==========================================
CREATE TABLE IF NOT EXISTS public.dados_cadastro (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria text NOT NULL,
  descricao text NOT NULL,
  valor numeric NOT NULL,
  data date NOT NULL,
  responsavel text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: faturamento
-- ==========================================
CREATE TABLE IF NOT EXISTS public.faturamento (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text NOT NULL,
  cliente text NOT NULL,
  valor numeric NOT NULL,
  data_emissao date NOT NULL,
  data_vencimento date NOT NULL,
  status text NOT NULL,
  observacoes text,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: contas_pagar
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contas_pagar (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  fornecedor text NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL,
  valor numeric NOT NULL,
  data_emissao date NOT NULL,
  data_vencimento date NOT NULL,
  status text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: contas_receber
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contas_receber (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente text NOT NULL,
  descricao text NOT NULL,
  categoria text NOT NULL,
  valor numeric NOT NULL,
  data_emissao date NOT NULL,
  data_vencimento date NOT NULL,
  status text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: empreendimentos
-- ==========================================
CREATE TABLE IF NOT EXISTS public.empreendimentos (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo text NOT NULL,
  nome text NOT NULL,
  endereco text,
  fase text NOT NULL,
  status text NOT NULL,
  unidades integer NOT NULL DEFAULT 0,
  vendidas integer NOT NULL DEFAULT 0,
  previsao date,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: contratos
-- ==========================================
CREATE TABLE IF NOT EXISTS public.contratos (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero text NOT NULL,
  objeto text NOT NULL,
  fornecedor text NOT NULL,
  valor numeric NOT NULL,
  data_inicio date NOT NULL,
  data_fim date,
  status text NOT NULL,
  empreendimento_id uuid,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: materiais
-- ==========================================
CREATE TABLE IF NOT EXISTS public.materiais (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo text NOT NULL,
  nome text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric NOT NULL DEFAULT 0,
  minimo numeric NOT NULL DEFAULT 0,
  canteiro text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: relatorios_gerados
-- ==========================================
CREATE TABLE IF NOT EXISTS public.relatorios_gerados (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  tipo text NOT NULL,
  formato text NOT NULL,
  periodo_inicio date NOT NULL,
  periodo_fim date NOT NULL,
  registros integer NOT NULL DEFAULT 0,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- ==========================================
-- TABELA: responsavel_performance
-- ==========================================
CREATE TABLE IF NOT EXISTS public.responsavel_performance (
  id uuid NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text,
  mes_ano text,
  total_metas integer DEFAULT 0,
  metas_concluidas integer DEFAULT 0,
  metas_no_prazo integer DEFAULT 0,
  metas_atrasadas integer DEFAULT 0,
  taxa_sucesso numeric DEFAULT 0,
  pontos_gamificacao integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);