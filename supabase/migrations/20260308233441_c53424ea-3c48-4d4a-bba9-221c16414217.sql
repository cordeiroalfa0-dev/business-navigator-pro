
-- =====================================================
-- FIX 1: Convert ALL restrictive policies to PERMISSIVE
-- =====================================================

-- acoes_meta
DROP POLICY IF EXISTS "Admin and master can delete acoes" ON public.acoes_meta;
DROP POLICY IF EXISTS "Authenticated users can insert own acoes" ON public.acoes_meta;
DROP POLICY IF EXISTS "Authenticated users can view acoes" ON public.acoes_meta;
DROP POLICY IF EXISTS "Users can delete own acoes" ON public.acoes_meta;
DROP POLICY IF EXISTS "Users can update acoes" ON public.acoes_meta;

CREATE POLICY "view_acoes" ON public.acoes_meta FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_acoes" ON public.acoes_meta FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "update_acoes" ON public.acoes_meta FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_acoes" ON public.acoes_meta FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());

-- contas_pagar
DROP POLICY IF EXISTS "Admin and master can delete contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Admin and master can insert contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Admin and master can update contas_pagar" ON public.contas_pagar;
DROP POLICY IF EXISTS "Authenticated users can view contas_pagar" ON public.contas_pagar;

CREATE POLICY "view_contas_pagar" ON public.contas_pagar FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_contas_pagar" ON public.contas_pagar FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_contas_pagar" ON public.contas_pagar FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_contas_pagar" ON public.contas_pagar FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- contas_receber
DROP POLICY IF EXISTS "Admin and master can delete contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Admin and master can insert contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Admin and master can update contas_receber" ON public.contas_receber;
DROP POLICY IF EXISTS "Authenticated users can view contas_receber" ON public.contas_receber;

CREATE POLICY "view_contas_receber" ON public.contas_receber FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_contas_receber" ON public.contas_receber FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_contas_receber" ON public.contas_receber FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_contas_receber" ON public.contas_receber FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- contratos
DROP POLICY IF EXISTS "Admin and master can delete contratos" ON public.contratos;
DROP POLICY IF EXISTS "Admin and master can insert contratos" ON public.contratos;
DROP POLICY IF EXISTS "Admin and master can update contratos" ON public.contratos;
DROP POLICY IF EXISTS "Authenticated users can view contratos" ON public.contratos;

CREATE POLICY "view_contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_contratos" ON public.contratos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_contratos" ON public.contratos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- dados_cadastro
DROP POLICY IF EXISTS "Admin and master can delete dados" ON public.dados_cadastro;
DROP POLICY IF EXISTS "Admin and master can insert dados" ON public.dados_cadastro;
DROP POLICY IF EXISTS "Admin and master can update dados" ON public.dados_cadastro;
DROP POLICY IF EXISTS "Authenticated users can view dados" ON public.dados_cadastro;

CREATE POLICY "view_dados" ON public.dados_cadastro FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_dados" ON public.dados_cadastro FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_dados" ON public.dados_cadastro FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_dados" ON public.dados_cadastro FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());

-- empreendimentos
DROP POLICY IF EXISTS "Admin and master can delete empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Admin and master can insert empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Admin and master can update empreendimentos" ON public.empreendimentos;
DROP POLICY IF EXISTS "Authenticated users can view empreendimentos" ON public.empreendimentos;

CREATE POLICY "view_empreendimentos" ON public.empreendimentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_empreendimentos" ON public.empreendimentos FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_empreendimentos" ON public.empreendimentos FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_empreendimentos" ON public.empreendimentos FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- faturamento
DROP POLICY IF EXISTS "Admin and master can delete faturamento" ON public.faturamento;
DROP POLICY IF EXISTS "Admin and master can insert faturamento" ON public.faturamento;
DROP POLICY IF EXISTS "Admin and master can update faturamento" ON public.faturamento;
DROP POLICY IF EXISTS "Authenticated users can view faturamento" ON public.faturamento;

CREATE POLICY "view_faturamento" ON public.faturamento FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_faturamento" ON public.faturamento FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_faturamento" ON public.faturamento FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_faturamento" ON public.faturamento FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- materiais
DROP POLICY IF EXISTS "Admin and master can delete materiais" ON public.materiais;
DROP POLICY IF EXISTS "Admin and master can insert materiais" ON public.materiais;
DROP POLICY IF EXISTS "Admin and master can update materiais" ON public.materiais;
DROP POLICY IF EXISTS "Authenticated users can view materiais" ON public.materiais;

CREATE POLICY "view_materiais" ON public.materiais FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_materiais" ON public.materiais FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_materiais" ON public.materiais FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_materiais" ON public.materiais FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- meta_checkins
DROP POLICY IF EXISTS "Authenticated users can view checkins" ON public.meta_checkins;
DROP POLICY IF EXISTS "Editors can delete checkins" ON public.meta_checkins;
DROP POLICY IF EXISTS "Users can delete own checkins" ON public.meta_checkins;
DROP POLICY IF EXISTS "Users can insert own checkins" ON public.meta_checkins;
DROP POLICY IF EXISTS "Users can update own checkins" ON public.meta_checkins;

CREATE POLICY "view_checkins" ON public.meta_checkins FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_checkins" ON public.meta_checkins FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "update_checkins" ON public.meta_checkins FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_checkins" ON public.meta_checkins FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR user_id = auth.uid());

-- metas
DROP POLICY IF EXISTS "Admin and master can delete metas" ON public.metas;
DROP POLICY IF EXISTS "Admin and master can insert metas" ON public.metas;
DROP POLICY IF EXISTS "Authenticated users can view metas" ON public.metas;
DROP POLICY IF EXISTS "Users can update metas" ON public.metas;

CREATE POLICY "view_metas" ON public.metas FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_metas" ON public.metas FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));
CREATE POLICY "update_metas" ON public.metas FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid()) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR created_by = auth.uid());
CREATE POLICY "delete_metas" ON public.metas FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

-- profiles
DROP POLICY IF EXISTS "Admins and masters can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins or owners can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "view_profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role) OR auth.uid() = id);
CREATE POLICY "insert_profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_profiles" ON public.profiles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = id);

-- relatorios_gerados
DROP POLICY IF EXISTS "Admins can delete relatorios" ON public.relatorios_gerados;
DROP POLICY IF EXISTS "Authenticated users can view relatorios" ON public.relatorios_gerados;
DROP POLICY IF EXISTS "Users can insert own relatorios" ON public.relatorios_gerados;

CREATE POLICY "view_relatorios" ON public.relatorios_gerados FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_relatorios" ON public.relatorios_gerados FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "delete_relatorios" ON public.relatorios_gerados FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- user_roles: CRITICAL - users must read their OWN role for auth to work
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view roles" ON public.user_roles;

CREATE POLICY "view_own_role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_insert_roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_update_roles" ON public.user_roles FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admin_delete_roles" ON public.user_roles FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- FIX 2: Create missing triggers
-- =====================================================

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updating updated_at on metas
CREATE OR REPLACE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
