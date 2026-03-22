
-- ==========================================
-- MÓDULO FINANCEIRO
-- ==========================================

-- Faturamento (Notas Fiscais)
CREATE TABLE public.faturamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL DEFAULT '',
  cliente text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  observacoes text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faturamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view faturamento" ON public.faturamento
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert faturamento" ON public.faturamento
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admin and master can update faturamento" ON public.faturamento
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid());

CREATE POLICY "Admin and master can delete faturamento" ON public.faturamento
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- Contas a Pagar
CREATE TABLE public.contas_pagar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  categoria text NOT NULL DEFAULT 'outros',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_pagar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contas_pagar" ON public.contas_pagar
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert contas_pagar" ON public.contas_pagar
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admin and master can update contas_pagar" ON public.contas_pagar
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid());

CREATE POLICY "Admin and master can delete contas_pagar" ON public.contas_pagar
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- Contas a Receber
CREATE TABLE public.contas_receber (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente text NOT NULL DEFAULT '',
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente',
  data_emissao date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date NOT NULL DEFAULT (CURRENT_DATE + interval '30 days')::date,
  categoria text NOT NULL DEFAULT 'outros',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contas_receber ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contas_receber" ON public.contas_receber
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert contas_receber" ON public.contas_receber
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admin and master can update contas_receber" ON public.contas_receber
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid());

CREATE POLICY "Admin and master can delete contas_receber" ON public.contas_receber
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- ==========================================
-- MÓDULO OBRAS
-- ==========================================

-- Empreendimentos
CREATE TABLE public.empreendimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL DEFAULT '',
  nome text NOT NULL DEFAULT '',
  fase text NOT NULL DEFAULT 'Projeto',
  unidades integer NOT NULL DEFAULT 0,
  vendidas integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planejamento',
  previsao date,
  endereco text DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view empreendimentos" ON public.empreendimentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert empreendimentos" ON public.empreendimentos
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admin and master can update empreendimentos" ON public.empreendimentos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid());

CREATE POLICY "Admin and master can delete empreendimentos" ON public.empreendimentos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- Contratos
CREATE TABLE public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL DEFAULT '',
  fornecedor text NOT NULL DEFAULT '',
  objeto text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contratos" ON public.contratos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert contratos" ON public.contratos
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admin and master can update contratos" ON public.contratos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid());

CREATE POLICY "Admin and master can delete contratos" ON public.contratos
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

-- Materiais (Estoque)
CREATE TABLE public.materiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL DEFAULT '',
  nome text NOT NULL DEFAULT '',
  canteiro text NOT NULL DEFAULT '',
  quantidade numeric NOT NULL DEFAULT 0,
  minimo numeric NOT NULL DEFAULT 0,
  unidade text NOT NULL DEFAULT 'un',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.materiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view materiais" ON public.materiais
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and master can insert materiais" ON public.materiais
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));

CREATE POLICY "Admin and master can update materiais" ON public.materiais
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid())
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master') OR created_by = auth.uid());

CREATE POLICY "Admin and master can delete materiais" ON public.materiais
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'master'));
