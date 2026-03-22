-- Tabela para execução real de obra (Fundação, Estrutura, Acabamentos...)
create table if not exists public.execucao_obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  etapa_atual text not null default 'Fundação',
  progresso integer not null default 0 check (progresso >= 0 and progresso <= 100),
  responsavel text default '',
  data_inicio date,
  data_prevista date,
  observacao text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.execucao_obras enable row level security;

-- Política: autenticados podem ler
create policy "execucao_obras_select" on public.execucao_obras
  for select using (auth.role() = 'authenticated');

-- Política: autenticados podem inserir
create policy "execucao_obras_insert" on public.execucao_obras
  for insert with check (auth.role() = 'authenticated');

-- Política: autenticados podem atualizar
create policy "execucao_obras_update" on public.execucao_obras
  for update using (auth.role() = 'authenticated');

-- Política: autenticados podem deletar
create policy "execucao_obras_delete" on public.execucao_obras
  for delete using (auth.role() = 'authenticated');

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger execucao_obras_updated_at
  before update on public.execucao_obras
  for each row execute function public.set_updated_at();
