-- Allow authenticated clients to use role helpers
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Secure bootstrap for the very first admin only
create or replace function public.bootstrap_first_admin(_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if _full_name is null or char_length(trim(_full_name)) < 2 or char_length(trim(_full_name)) > 120 then
    raise exception 'Invalid full name';
  end if;

  if exists (select 1 from public.user_roles where role = 'admin') then
    raise exception 'Admin already exists';
  end if;

  update public.profiles
  set full_name = trim(_full_name)
  where id = auth.uid();

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'admin')
  on conflict (user_id, role) do nothing;
end;
$$;

grant execute on function public.bootstrap_first_admin(text) to authenticated;