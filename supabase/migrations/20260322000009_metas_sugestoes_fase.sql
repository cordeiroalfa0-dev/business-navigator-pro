-- ============================================================
-- Tabela: metas_sugestoes_fase
-- Armazena sugestões de metas personalizáveis por fase de obra.
-- Admin pode adicionar, editar e excluir sugestões.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.metas_sugestoes_fase (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  fase        text    NOT NULL,
  nome        text    NOT NULL,
  descricao   text    DEFAULT '',
  unidade     text    NOT NULL DEFAULT '%',
  objetivo    numeric NOT NULL DEFAULT 100,
  prioridade  text    NOT NULL DEFAULT 'media',
  categoria   text    NOT NULL DEFAULT 'Construção',
  ordem       integer NOT NULL DEFAULT 0,
  ativo       boolean NOT NULL DEFAULT true,
  criado_por  uuid    REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_metas_sugestoes_fase ON public.metas_sugestoes_fase(fase);
CREATE INDEX IF NOT EXISTS idx_metas_sugestoes_ativo ON public.metas_sugestoes_fase(ativo);

-- RLS
ALTER TABLE public.metas_sugestoes_fase ENABLE ROW LEVEL SECURITY;

-- Todos autenticados leem
CREATE POLICY "sugestoes_select" ON public.metas_sugestoes_fase
  FOR SELECT USING (auth.role() = 'authenticated');

-- Apenas admin/master inserem
CREATE POLICY "sugestoes_insert" ON public.metas_sugestoes_fase
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','master'))
  );

-- Apenas admin/master atualizam
CREATE POLICY "sugestoes_update" ON public.metas_sugestoes_fase
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','master'))
  );

-- Apenas admin/master excluem
CREATE POLICY "sugestoes_delete" ON public.metas_sugestoes_fase
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role IN ('admin','master'))
  );

-- ── Seed: sugestões padrão por fase ──────────────────────────────────────
INSERT INTO public.metas_sugestoes_fase (fase, nome, descricao, unidade, objetivo, prioridade, categoria, ordem) VALUES
-- Fundação
('Fundação','Sondagem e laudo do solo','Estudo geotécnico completo do terreno','%',100,'alta','Engenharia',1),
('Fundação','Execução de estacas','Quantidade total de estacas a executar','un',0,'alta','Construção',2),
('Fundação','Concretagem da radier/sapatas','Área de fundação a concretar','m²',0,'alta','Construção',3),
('Fundação','Impermeabilização da fundação','Impermeabilização total da fundação','%',100,'media','Qualidade',4),
('Fundação','Aprovação do projeto estrutural','Aprovação pelos órgãos responsáveis','%',100,'alta','Projetos',5),
-- Estrutura
('Estrutura','Concretagem de pilares','Total de pilares a concretar','un',0,'alta','Construção',1),
('Estrutura','Concretagem de vigas e lajes','Área de lajes a concretar','m²',0,'alta','Construção',2),
('Estrutura','Armação estrutural','Quantidade de aço utilizado','kg',0,'alta','Materiais',3),
('Estrutura','Escoramento e cimbramento','Estrutura de escoramento completa','%',100,'media','Segurança',4),
('Estrutura','Inspeção estrutural — RRT/ART','Responsabilidade técnica assinada','%',100,'alta','Qualidade',5),
-- Alvenaria
('Alvenaria','Alvenaria de vedação externa','Área de paredes externas','m²',0,'alta','Construção',1),
('Alvenaria','Alvenaria de vedação interna','Área de paredes internas','m²',0,'media','Construção',2),
('Alvenaria','Vergas e contravergas','Vergas executadas em todas as aberturas','%',100,'media','Qualidade',3),
('Alvenaria','Chapisco e emboço externo','Área de reboco externo','m²',0,'media','Construção',4),
('Alvenaria','Regularização de piso','Contrapiso regularizado','m²',0,'baixa','Construção',5),
-- Instalações
('Instalações','Instalações elétricas — passagem','Eletrodutos e caixas instalados','%',100,'alta','Engenharia',1),
('Instalações','Instalações hidráulicas','Tubulações de água e esgoto','%',100,'alta','Engenharia',2),
('Instalações','SPDA — para-raios','Sistema de proteção contra descargas','%',100,'media','Segurança',3),
('Instalações','Instalações de gás','Rede de gás instalada e testada','%',100,'alta','Engenharia',4),
('Instalações','Cabeamento estruturado / telecom','Infraestrutura de dados e telefonia','%',100,'baixa','Engenharia',5),
-- Acabamentos
('Acabamentos','Revestimento cerâmico — piso','Área de piso cerâmico assentado','m²',0,'alta','Construção',1),
('Acabamentos','Revestimento cerâmico — paredes','Área de revestimento de paredes','m²',0,'media','Construção',2),
('Acabamentos','Pintura interna','Área pintada internamente','m²',0,'media','Construção',3),
('Acabamentos','Pintura externa / fachada','Área de fachada pintada','m²',0,'alta','Construção',4),
('Acabamentos','Louças e metais sanitários','Instalação de louças e metais','%',100,'media','Materiais',5),
('Acabamentos','Esquadrias — portas e janelas','Todas as esquadrias instaladas','%',100,'alta','Construção',6),
('Acabamentos','Vistoria e entrega do imóvel','Checklist de vistoria completo','%',100,'alta','Qualidade',7),
-- Entregue
('Entregue','Habite-se / Auto de conclusão','Documento de conclusão aprovado','%',100,'alta','Projetos',1),
('Entregue','Entrega de chaves','Entrega formal da unidade','%',100,'alta','Operacional',2),
('Entregue','Manual do proprietário','Manual entregue ao cliente','%',100,'media','Qualidade',3),
('Entregue','Quitação de fornecedores','Todos os pagamentos quitados','%',100,'alta','Financeiro',4)
ON CONFLICT DO NOTHING;
