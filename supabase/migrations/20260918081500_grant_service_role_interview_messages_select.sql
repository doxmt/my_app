-- M4 5단계 보정: interview-chat Edge Function이 회원 대화 이력을 조회하려면
-- interview_messages에 대한 select도 service_role에 필요하다 (앞선 마이그레이션은 insert만 부여했다).

grant select on public.interview_messages to service_role;
