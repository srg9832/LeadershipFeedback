-- CAP Leadership Feedback v1.2.0 upgrade
-- Adds the public, submission-only Cadet Self-Evaluation workflow.
-- Existing standard feedback entry remains unchanged.
-- Designed for the existing CAP Applications / CAP Schedule Supabase project.

begin;

do $$ begin
  if to_regclass('public.leadership_feedback') is null
     or to_regclass('public.leadership_unit_permissions') is null
     or to_regclass('public.members') is null
     or to_regclass('public.units') is null then
    raise exception 'Install the CAP Leadership Feedback v1.1 database migration before this v1.2 upgrade.';
  end if;
end $$;

create table if not exists public.leadership_self_evaluations (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  subject_member_id uuid references public.members(id) on delete set null,

  capid_snapshot text not null,
  first_name_snapshot text not null,
  last_name_snapshot text not null,
  current_grade text not null,
  form_type text not null check (form_type in ('phase1','phase2','phase3','phase4')),

  self_ratings jsonb not null default '{}'::jsonb,
  self_narratives jsonb not null default '{}'::jsonb,

  status text not null default 'awaiting_evaluator'
    check (status in ('awaiting_evaluator','evaluator_in_progress','ready_for_review','completed','cancelled')),
  assigned_evaluator_user_id uuid references public.profiles(id) on delete set null,
  assigned_evaluator_name_snapshot text,
  evaluator_ratings jsonb not null default '{}'::jsonb,
  evaluator_narratives jsonb not null default '{}'::jsonb,
  evaluator_title text,
  evaluator_started_at timestamptz,
  evaluator_completed_at timestamptz,

  final_review_date date,
  decision jsonb not null default '{}'::jsonb,
  completed_feedback_id uuid references public.leadership_feedback(id) on delete set null,
  finalized_at timestamptz,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (capid_snapshot ~ '^[0-9]{5,8}$'),
  check (char_length(first_name_snapshot) between 1 and 100),
  check (char_length(last_name_snapshot) between 1 and 100),
  check (current_grade in (
    'C/AB','C/Amn','C/A1C','C/SrA','C/SSgt','C/TSgt','C/MSgt','C/SMSgt','C/CMSgt',
    'C/2d Lt','C/1st Lt','C/Capt','C/Maj','C/Lt Col','C/Col'
  ))
);

create index if not exists idx_leadership_self_eval_unit_status
  on public.leadership_self_evaluations(unit_id,status,submitted_at desc);
create index if not exists idx_leadership_self_eval_assigned
  on public.leadership_self_evaluations(assigned_evaluator_user_id,status);
create index if not exists idx_leadership_self_eval_completed_feedback
  on public.leadership_self_evaluations(completed_feedback_id)
  where completed_feedback_id is not null;

create unique index if not exists uq_leadership_self_eval_open_capid_unit
  on public.leadership_self_evaluations(unit_id,capid_snapshot)
  where status in ('awaiting_evaluator','evaluator_in_progress','ready_for_review');

drop trigger if exists trg_leadership_self_evaluations_updated_at on public.leadership_self_evaluations;
create trigger trg_leadership_self_evaluations_updated_at
before update on public.leadership_self_evaluations
for each row execute function public.set_updated_at();

create or replace function public.can_read_leadership_self_evaluation(p_unit_id uuid)
returns boolean
language sql stable security definer set search_path=public
as $$
  select auth.uid() is not null and (
    public.is_leadership_app_admin()
    or public.has_leadership_unit_role(p_unit_id,'cadet_evaluator')
    or public.has_leadership_unit_role(p_unit_id,'cadet_reviewer')
    or public.has_leadership_unit_role(p_unit_id,'unit_admin')
  );
$$;

create or replace function public.leadership_claim_self_evaluation(p_request_id uuid)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_req public.leadership_self_evaluations%rowtype;
  v_name text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_req
  from public.leadership_self_evaluations
  where id=p_request_id
  for update;

  if v_req.id is null then raise exception 'Self-evaluation request not found'; end if;
  if v_req.status in ('completed','cancelled') then raise exception 'This request is already closed'; end if;
  if not public.has_leadership_unit_role(v_req.unit_id,'cadet_evaluator') then
    raise exception 'Cadet Evaluator permission required';
  end if;
  if v_req.assigned_evaluator_user_id is not null
     and v_req.assigned_evaluator_user_id<>v_user
     and not public.is_leadership_app_admin() then
    raise exception 'This request is already assigned to another evaluator';
  end if;

  select coalesce(nullif(p.display_name,''),trim(concat_ws(' ',m.first_name,m.last_name)),'CAP User')
  into v_name
  from public.profiles p
  left join public.members m on m.id=p.member_id
  where p.id=v_user;

  update public.leadership_self_evaluations
  set assigned_evaluator_user_id=v_user,
      assigned_evaluator_name_snapshot=v_name,
      status=case when status='ready_for_review' then status else 'evaluator_in_progress' end,
      evaluator_started_at=coalesce(evaluator_started_at,now())
  where id=p_request_id;

  insert into public.leadership_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values(v_user,'CLAIM','self_evaluation',p_request_id::text,jsonb_build_object('unit_id',v_req.unit_id));

  return p_request_id;
end $$;

create or replace function public.leadership_save_self_evaluation_evaluator(
  p_request_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_req public.leadership_self_evaluations%rowtype;
  v_ratings jsonb := coalesce(p_payload->'ratings','{}'::jsonb);
  v_narratives jsonb := coalesce(p_payload->'narratives','{}'::jsonb);
  v_expected integer;
  v_name text;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_req
  from public.leadership_self_evaluations
  where id=p_request_id
  for update;

  if v_req.id is null then raise exception 'Self-evaluation request not found'; end if;
  if v_req.status in ('completed','cancelled') then raise exception 'This request is already closed'; end if;
  if not public.has_leadership_unit_role(v_req.unit_id,'cadet_evaluator') then
    raise exception 'Cadet Evaluator permission required';
  end if;
  if v_req.assigned_evaluator_user_id is not null
     and v_req.assigned_evaluator_user_id<>v_user
     and not public.is_leadership_app_admin() then
    raise exception 'This request is assigned to another evaluator';
  end if;

  v_expected := case v_req.form_type
    when 'phase1' then 4
    when 'phase2' then 5
    when 'phase3' then 7
    when 'phase4' then 7
    else 0 end;

  if v_expected=0 then raise exception 'Unsupported feedback form'; end if;
  if exists(
    select 1 from generate_series(0,v_expected-1) g(i)
    where coalesce(v_ratings->>g.i::text,'') not in ('Needs Improvement','Satisfactory','Very Good','Excellent')
  ) then
    raise exception 'Every evaluator rating category must be completed';
  end if;

  if char_length(coalesce(v_narratives->>'leaderSuccess','')) > 8000
     or char_length(coalesce(v_narratives->>'leaderImprove','')) > 8000 then
    raise exception 'Evaluator narrative is too long';
  end if;

  select coalesce(nullif(p.display_name,''),trim(concat_ws(' ',m.first_name,m.last_name)),'CAP User')
  into v_name
  from public.profiles p
  left join public.members m on m.id=p.member_id
  where p.id=v_user;

  update public.leadership_self_evaluations
  set assigned_evaluator_user_id=v_user,
      assigned_evaluator_name_snapshot=v_name,
      evaluator_started_at=coalesce(evaluator_started_at,now()),
      evaluator_ratings=v_ratings,
      evaluator_narratives=jsonb_build_object(
        'leaderSuccess',coalesce(v_narratives->>'leaderSuccess',''),
        'leaderImprove',coalesce(v_narratives->>'leaderImprove','')
      ),
      evaluator_title=nullif(left(coalesce(p_payload->>'evaluatorTitle',''),250),''),
      evaluator_completed_at=now(),
      status='ready_for_review'
  where id=p_request_id;

  insert into public.leadership_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values(v_user,'EVALUATOR_READY','self_evaluation',p_request_id::text,jsonb_build_object('unit_id',v_req.unit_id));

  return p_request_id;
end $$;

create or replace function public.leadership_finalize_self_evaluation(
  p_request_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_req public.leadership_self_evaluations%rowtype;
  v_member public.members%rowtype;
  v_assignment public.member_unit_assignments%rowtype;
  v_feedback_id uuid;
  v_evaluator_name text;
  v_promotion text := lower(coalesce(p_payload->>'promotion',''));
  v_review_date date;
  v_next_review date;
  v_decision jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;

  select * into v_req
  from public.leadership_self_evaluations
  where id=p_request_id
  for update;

  if v_req.id is null then raise exception 'Self-evaluation request not found'; end if;
  if v_req.status<>'ready_for_review' then raise exception 'Evaluator review must be completed first'; end if;
  if not public.has_leadership_unit_role(v_req.unit_id,'cadet_evaluator') then
    raise exception 'Cadet Evaluator permission required';
  end if;
  if v_req.assigned_evaluator_user_id is not null
     and v_req.assigned_evaluator_user_id<>v_user
     and not public.is_leadership_app_admin() then
    raise exception 'This request is assigned to another evaluator';
  end if;

  if v_promotion not in ('approved','sustained') then
    raise exception 'Select Promotion Approved or Retain in Grade';
  end if;

  begin
    v_review_date := nullif(p_payload->>'reviewDate','')::date;
  exception when others then
    raise exception 'A valid formal review date is required';
  end;
  if v_review_date is null then raise exception 'Formal review date is required'; end if;

  begin
    v_next_review := nullif(p_payload->>'nextReview','')::date;
  exception when others then
    raise exception 'Date of next review is invalid';
  end;
  if v_promotion='sustained' and v_next_review is null then
    raise exception 'Date of next review is required when retaining a cadet in grade';
  end if;

  select * into v_member from public.members where capid=v_req.capid_snapshot;
  if v_member.id is null then
    insert into public.members(capid,first_name,last_name,member_type,active)
    values(v_req.capid_snapshot,v_req.first_name_snapshot,v_req.last_name_snapshot,'Cadet',true)
    returning * into v_member;
  else
    if v_member.member_type<>'Cadet' then raise exception 'CAPID is registered as a Senior member'; end if;
    update public.members set active=true where id=v_member.id;
  end if;

  if exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='members' and column_name='current_grade'
  ) then
    execute 'update public.members set current_grade=$1 where id=$2'
      using v_req.current_grade,v_member.id;
  end if;

  select a.* into v_assignment
  from public.member_unit_assignments a
  where a.member_id=v_member.id and a.active and a.is_primary
  order by a.start_date desc limit 1;

  if v_assignment.id is not null and v_assignment.unit_id<>v_req.unit_id then
    raise exception 'This CAPID is currently assigned to another unit. Cancel this request and have the cadet submit to the correct unit.';
  end if;
  if v_assignment.id is null then
    insert into public.member_unit_assignments(member_id,unit_id,is_primary,active,start_date)
    values(v_member.id,v_req.unit_id,true,true,current_date)
    returning * into v_assignment;
  end if;

  select coalesce(nullif(p.display_name,''),trim(concat_ws(' ',m.first_name,m.last_name)),'CAP User')
  into v_evaluator_name
  from public.profiles p
  left join public.members m on m.id=p.member_id
  where p.id=v_user;

  v_decision := jsonb_build_object(
    'promotion',v_promotion,
    'nextReview',coalesce(to_char(v_next_review,'YYYY-MM-DD'),'')
  );

  insert into public.leadership_feedback(
    form_type,subject_member_id,evaluator_user_id,evaluation_unit_type,
    unit_id_at_evaluation,encampment_id,
    capid_snapshot,first_name_snapshot,last_name_snapshot,member_type_at_evaluation,grade_at_evaluation,
    evaluator_name_snapshot,evaluator_title,
    review_start,review_end,discussion_date,feedback_type,feedback_mode,duty_title,
    ratings,comments,narratives,decision
  ) values (
    v_req.form_type,v_member.id,v_user,'unit',
    v_req.unit_id,null,
    v_req.capid_snapshot,v_req.first_name_snapshot,v_req.last_name_snapshot,'Cadet',v_req.current_grade,
    v_evaluator_name,coalesce(nullif(p_payload->>'evaluatorTitle',''),v_req.evaluator_title),
    null,v_review_date,v_review_date,'Self-Evaluation Workflow','Remote Self-Evaluation + Formal Review',null,
    v_req.evaluator_ratings,'{}'::jsonb,
    jsonb_build_object(
      'cadetSuccess',coalesce(v_req.self_narratives->>'cadetSuccess',''),
      'leaderSuccess',coalesce(v_req.evaluator_narratives->>'leaderSuccess',''),
      'cadetImprove',coalesce(v_req.self_narratives->>'cadetImprove',''),
      'leaderImprove',coalesce(v_req.evaluator_narratives->>'leaderImprove','')
    ),
    v_decision
  ) returning id into v_feedback_id;

  update public.leadership_self_evaluations
  set subject_member_id=v_member.id,
      assigned_evaluator_user_id=v_user,
      assigned_evaluator_name_snapshot=v_evaluator_name,
      evaluator_title=coalesce(nullif(p_payload->>'evaluatorTitle',''),evaluator_title),
      final_review_date=v_review_date,
      decision=v_decision,
      completed_feedback_id=v_feedback_id,
      finalized_at=now(),
      status='completed'
  where id=p_request_id;

  insert into public.leadership_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values(v_user,'COMPLETE','self_evaluation',p_request_id::text,
    jsonb_build_object('feedback_id',v_feedback_id,'unit_id',v_req.unit_id,'form_type',v_req.form_type));

  return v_feedback_id;
end $$;

create or replace function public.leadership_cancel_self_evaluation(p_request_id uuid)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_user uuid := auth.uid();
  v_req public.leadership_self_evaluations%rowtype;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_req from public.leadership_self_evaluations where id=p_request_id for update;
  if v_req.id is null then raise exception 'Self-evaluation request not found'; end if;
  if v_req.status='completed' then raise exception 'Completed requests cannot be cancelled'; end if;
  if not (
    public.is_leadership_app_admin()
    or public.has_leadership_unit_role(v_req.unit_id,'cadet_evaluator')
    or public.has_leadership_unit_role(v_req.unit_id,'cadet_reviewer')
    or public.has_leadership_unit_role(v_req.unit_id,'unit_admin')
  ) then raise exception 'Not authorized'; end if;

  update public.leadership_self_evaluations set status='cancelled' where id=p_request_id;
  insert into public.leadership_audit_log(actor_user_id,action,entity_type,entity_id,details)
  values(v_user,'CANCEL','self_evaluation',p_request_id::text,jsonb_build_object('unit_id',v_req.unit_id));
  return p_request_id;
end $$;

alter table public.leadership_self_evaluations enable row level security;

do $$ declare r record; begin
  for r in select schemaname,tablename,policyname from pg_policies
  where schemaname='public' and tablename='leadership_self_evaluations'
    and policyname like 'leadership_%'
  loop execute format('drop policy if exists %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop;
end $$;

create policy leadership_self_evaluations_authenticated_read
  on public.leadership_self_evaluations for select to authenticated
  using(public.can_read_leadership_self_evaluation(unit_id));

revoke all on public.leadership_self_evaluations from anon;
revoke insert,update,delete on public.leadership_self_evaluations from authenticated;
grant select on public.leadership_self_evaluations to authenticated;

revoke execute on function public.can_read_leadership_self_evaluation(uuid) from public,anon;
revoke execute on function public.leadership_claim_self_evaluation(uuid) from public,anon;
revoke execute on function public.leadership_save_self_evaluation_evaluator(uuid,jsonb) from public,anon;
revoke execute on function public.leadership_finalize_self_evaluation(uuid,jsonb) from public,anon;
revoke execute on function public.leadership_cancel_self_evaluation(uuid) from public,anon;

grant execute on function public.can_read_leadership_self_evaluation(uuid) to authenticated;
grant execute on function public.leadership_claim_self_evaluation(uuid) to authenticated;
grant execute on function public.leadership_save_self_evaluation_evaluator(uuid,jsonb) to authenticated;
grant execute on function public.leadership_finalize_self_evaluation(uuid,jsonb) to authenticated;
grant execute on function public.leadership_cancel_self_evaluation(uuid) to authenticated;

commit;
