-- ============================================================
-- Função: gerar_alertas_prazo
-- Verifica metas em risco/atrasadas e obras atrasadas,
-- criando notificações automáticas para admins.
-- Chamar via Supabase Edge Function ou pg_cron.
-- ============================================================

create or replace function public.gerar_alertas_prazo()
returns void
language plpgsql
security definer
as $$
declare
  v_meta record;
  v_obra record;
  v_admin record;
  v_hoje date := current_date;
  v_existe integer;
begin

  -- ──────────────────────────────────────────────────────────
  -- 1. METAS EM RISCO com prazo futuro
  -- ──────────────────────────────────────────────────────────
  for v_meta in
    select id, nome, status, prazo, responsavel
    from public.metas
    where status in ('em_risco', 'atencao')
      and prazo is not null
      and prazo::date >= v_hoje
  loop
    for v_admin in
      select user_id from public.user_roles where role = 'admin'
    loop
      select count(*) into v_existe
      from public.admin_notifications
      where admin_id = v_admin.user_id
        and type = 'meta_em_risco'
        and is_read = false
        and title ilike '%' || v_meta.nome || '%';

      if v_existe = 0 then
        insert into public.admin_notifications
          (admin_id, type, title, message, severity, is_read)
        values (
          v_admin.user_id,
          'meta_em_risco',
          'Meta em risco: ' || v_meta.nome,
          'A meta "' || v_meta.nome || '" está com status '
            || replace(v_meta.status, '_', ' ')
            || '. Prazo: ' || to_char(v_meta.prazo::date, 'DD/MM/YYYY')
            || '. Responsável: ' || coalesce(v_meta.responsavel, '—'),
          case when v_meta.status = 'em_risco' then 'critical' else 'warning' end,
          false
        );
      end if;
    end loop;
  end loop;

  -- ──────────────────────────────────────────────────────────
  -- 2. METAS com prazo VENCIDO e não atingidas
  -- ──────────────────────────────────────────────────────────
  for v_meta in
    select id, nome, status, prazo, responsavel
    from public.metas
    where status != 'atingida'
      and prazo is not null
      and prazo::date < v_hoje
  loop
    for v_admin in
      select user_id from public.user_roles where role = 'admin'
    loop
      select count(*) into v_existe
      from public.admin_notifications
      where admin_id = v_admin.user_id
        and type = 'meta_atrasada'
        and is_read = false
        and title ilike '%' || v_meta.nome || '%';

      if v_existe = 0 then
        insert into public.admin_notifications
          (admin_id, type, title, message, severity, is_read)
        values (
          v_admin.user_id,
          'meta_atrasada',
          'Meta atrasada: ' || v_meta.nome,
          'A meta "' || v_meta.nome || '" venceu em '
            || to_char(v_meta.prazo::date, 'DD/MM/YYYY')
            || ' e ainda não foi atingida. Responsável: '
            || coalesce(v_meta.responsavel, '—'),
          'critical',
          false
        );
      end if;
    end loop;
  end loop;

  -- ──────────────────────────────────────────────────────────
  -- 3. OBRAS com data_prevista VENCIDA e não entregues
  -- ──────────────────────────────────────────────────────────
  for v_obra in
    select id, nome, etapa_atual, data_prevista, responsavel
    from public.execucao_obras
    where etapa_atual != 'Entregue'
      and data_prevista is not null
      and data_prevista < v_hoje
  loop
    for v_admin in
      select user_id from public.user_roles where role = 'admin'
    loop
      select count(*) into v_existe
      from public.admin_notifications
      where admin_id = v_admin.user_id
        and type = 'obra_atrasada'
        and is_read = false
        and title ilike '%' || v_obra.nome || '%';

      if v_existe = 0 then
        insert into public.admin_notifications
          (admin_id, type, title, message, severity, is_read)
        values (
          v_admin.user_id,
          'obra_atrasada',
          'Obra atrasada: ' || v_obra.nome,
          'A obra "' || v_obra.nome || '" estava prevista para '
            || to_char(v_obra.data_prevista, 'DD/MM/YYYY')
            || ' e ainda está na etapa ' || v_obra.etapa_atual
            || '. Responsável: ' || coalesce(v_obra.responsavel, '—'),
          'critical',
          false
        );
      end if;
    end loop;
  end loop;

end;
$$;

-- ──────────────────────────────────────────────────────────
-- Permissão para chamar via service_role (Edge Function)
-- ──────────────────────────────────────────────────────────
grant execute on function public.gerar_alertas_prazo() to service_role;

-- ──────────────────────────────────────────────────────────
-- INSTRUÇÃO: Para agendar via pg_cron (se habilitado no projeto):
--
-- select cron.schedule(
--   'alertas-prazo-diario',
--   '0 8 * * *',   -- todo dia às 08:00
--   $$ select public.gerar_alertas_prazo(); $$
-- );
--
-- Para remover o agendamento:
-- select cron.unschedule('alertas-prazo-diario');
-- ──────────────────────────────────────────────────────────
