-- M4 5단계: interview-chat Edge Function(service_role)이 회원 경로에서 직접 읽고/쓰는 테이블에 GRANT 보정.
-- increment_daily_usage RPC는 SECURITY DEFINER라 소유자 권한으로 실행되지만,
-- 남은 사용량 조회·이력서 조회·세션/메시지 조회·기록은 service_role 세션이 직접 select/insert한다.
-- 이 프로젝트는 새 테이블에 역할별 GRANT를 자동 부여하지 않으므로 명시해야 한다.

grant select on public.daily_usage to service_role;
grant select on public.resumes to service_role;
grant select, insert on public.interview_sessions to service_role;
grant insert on public.interview_messages to service_role;
