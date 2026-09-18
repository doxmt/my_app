-- M3: 비회원 사용량 증가 RPC + 한도 초기값
-- guest_daily_usage 테이블은 M1에서 이미 생성됨. 함수와 초기 한도만 추가한다.

-- =========================================================
-- increment_guest_usage: 기기 + IP 두 한도를 원자적으로 확인·증가
-- =========================================================
create or replace function public.increment_guest_usage(
  p_device_key text,
  p_ip_key text,
  p_device_limit integer,
  p_ip_limit integer
)
returns table (
  allowed boolean,
  blocked_by text,
  device_remaining integer,
  ip_remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_device_count integer;
  v_ip_count integer;
begin
  insert into public.guest_daily_usage (subject_type, subject_key, usage_date)
  values ('device', p_device_key, v_today), ('ip', p_ip_key, v_today)
  on conflict (subject_type, subject_key, usage_date) do nothing;

  -- (subject_type, subject_key) 순으로 정렬해 두 행을 한 문장으로 잠가 데드락을 피한다.
  select
    max(interview_messages_count) filter (where subject_type = 'device'),
    max(interview_messages_count) filter (where subject_type = 'ip')
  into v_device_count, v_ip_count
  from (
    select subject_type, interview_messages_count
    from public.guest_daily_usage
    where (subject_type = 'device' and subject_key = p_device_key and usage_date = v_today)
       or (subject_type = 'ip' and subject_key = p_ip_key and usage_date = v_today)
    order by subject_type, subject_key
    for update
  ) locked_rows;

  if v_device_count >= p_device_limit then
    return query select
      false,
      'device'::text,
      greatest(p_device_limit - v_device_count, 0),
      greatest(p_ip_limit - v_ip_count, 0);
    return;
  end if;

  if v_ip_count >= p_ip_limit then
    return query select
      false,
      'ip'::text,
      greatest(p_device_limit - v_device_count, 0),
      greatest(p_ip_limit - v_ip_count, 0);
    return;
  end if;

  update public.guest_daily_usage
  set interview_messages_count = interview_messages_count + 1
  where (subject_type = 'device' and subject_key = p_device_key and usage_date = v_today)
     or (subject_type = 'ip' and subject_key = p_ip_key and usage_date = v_today);

  return query select
    true,
    null::text,
    greatest(p_device_limit - v_device_count - 1, 0),
    greatest(p_ip_limit - v_ip_count - 1, 0);
end;
$$;

-- 기본적으로 함수 생성자가 public에 EXECUTE를 부여하므로 명시적으로 회수한다.
revoke all on function public.increment_guest_usage(text, text, integer, integer) from public;
grant execute on function public.increment_guest_usage(text, text, integer, integer) to service_role;

-- =========================================================
-- rate_limit_config 초기값 (임시값, 대시보드에서 조정 가능)
-- =========================================================
insert into public.rate_limit_config (tier, daily_interview_messages)
values
  ('guest_device', 10),
  ('guest_ip', 40)
on conflict (tier) do nothing;
