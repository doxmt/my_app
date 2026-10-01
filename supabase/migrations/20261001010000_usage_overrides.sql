-- 특정 회원 계정의 일일 면접 메시지 한도를 free 기본값 대신 지정한다(예: 운영자 본인 계정).
-- interview-chat Edge Function(service_role)만 읽는다. anon/authenticated에는 권한도 정책도 주지 않아
-- 회원이 자기 한도를 올릴 수 없다. 행 추가·수정은 대시보드/SQL에서만 한다.
create table public.usage_overrides (
  user_id uuid primary key references auth.users (id) on delete cascade,
  daily_interview_messages integer not null check (daily_interview_messages > 0),
  created_at timestamptz not null default now()
);

alter table public.usage_overrides enable row level security;

revoke all on public.usage_overrides from anon, authenticated;
grant select on public.usage_overrides to service_role;
