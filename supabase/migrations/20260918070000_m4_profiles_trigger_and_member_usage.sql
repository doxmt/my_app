-- M4 1단계: profiles 자동 생성 트리거 + increment_daily_usage(회원) RPC + free 한도 + wrong_notes.resolved_at

-- =========================================================
-- profiles 자동 생성 트리거 (auth.users insert 시)
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 트리거 도입 이전 가입자 백필
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- =========================================================
-- increment_daily_usage: 회원 일일 한도를 원자적으로 확인·증가
-- =========================================================
create or replace function public.increment_daily_usage(
  p_user_id uuid,
  p_limit integer
)
returns table (
  allowed boolean,
  remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_new_count integer;
  v_current_count integer;
begin
  insert into public.daily_usage (user_id, usage_date)
  values (p_user_id, v_today)
  on conflict (user_id, usage_date) do nothing;

  update public.daily_usage
  set interview_messages_count = interview_messages_count + 1
  where user_id = p_user_id
    and usage_date = v_today
    and interview_messages_count < p_limit
  returning interview_messages_count into v_new_count;

  if v_new_count is null then
    select interview_messages_count into v_current_count
    from public.daily_usage
    where user_id = p_user_id and usage_date = v_today;

    return query select false, greatest(p_limit - v_current_count, 0);
    return;
  end if;

  return query select true, greatest(p_limit - v_new_count, 0);
end;
$$;

revoke all on function public.increment_daily_usage(uuid, integer) from public;
grant execute on function public.increment_daily_usage(uuid, integer) to service_role;

-- =========================================================
-- rate_limit_config: free 한도 추가, guest_device 10 → 3으로 조정
-- =========================================================
insert into public.rate_limit_config (tier, daily_interview_messages)
values ('free', 12)
on conflict (tier) do nothing;

update public.rate_limit_config
set daily_interview_messages = 3
where tier = 'guest_device';

-- =========================================================
-- wrong_notes.resolved_at: 로컬 WrongNote.resolvedAt을 왕복시키기 위해 추가
-- =========================================================
alter table public.wrong_notes add column if not exists resolved_at timestamptz;
