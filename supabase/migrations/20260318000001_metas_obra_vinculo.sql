-- Adiciona coluna obra_id em metas (vínculo opcional com execucao_obras)
-- Metas SEM obra_id = Metas Estratégicas
-- Metas COM obra_id = Metas de Obra

alter table public.metas
  add column if not exists obra_id uuid references public.execucao_obras(id) on delete set null;

create index if not exists metas_obra_id_idx on public.metas(obra_id);
