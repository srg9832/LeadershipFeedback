create or replace function public.leadership_list_users(p_unit_id uuid)
returns table(
  id uuid,
  email text,
  display_name text,
  roles text[]
)
language plpgsql
stable
security definer
set search_path to 'pg_catalog'
as $$
declare
  v_is_app_admin boolean;
  v_is_unit_admin boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select exists(
    select 1
    from public.leadership_global_permissions g
    where g.user_id = auth.uid()
      and g.is_app_admin
  ) into v_is_app_admin;

  select exists(
    select 1
    from public.leadership_unit_permissions up
    where up.user_id = auth.uid()
      and up.unit_id = p_unit_id
      and up.unit_admin
  ) into v_is_unit_admin;

  if not v_is_app_admin and not v_is_unit_admin then
    raise exception 'Leadership App Admin or Unit Admin permission required';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(nullif(p.display_name,''),u.email)::text,
    array_remove(array[
      case when lup.cadet_evaluator then 'cadetEvaluator' end,
      case when lup.cadet_reviewer then 'cadetReviewer' end,
      case when lup.senior_evaluator then 'seniorEvaluator' end,
      case when lup.senior_reviewer then 'seniorReviewer' end,
      case when lup.unit_admin then 'unitAdmin' end,
      case when v_is_app_admin and coalesce(lgp.encampment_evaluator,false) then 'encampmentEvaluator' end,
      case when v_is_app_admin and coalesce(lgp.encampment_reviewer,false) then 'encampmentReviewer' end,
      case when v_is_app_admin and coalesce(lgp.encampment_admin,false) then 'encampmentAdmin' end,
      case when v_is_app_admin and coalesce(lgp.is_app_admin,false) then 'appAdmin' end
    ]::text[], null)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.leadership_unit_permissions lup
    on lup.user_id = u.id and lup.unit_id = p_unit_id
  left join public.leadership_global_permissions lgp
    on lgp.user_id = u.id
  order by coalesce(nullif(p.display_name,''),u.email);
end;
$$;

revoke execute on function public.leadership_list_users(uuid) from public, anon;
grant execute on function public.leadership_list_users(uuid) to authenticated;
