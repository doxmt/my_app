-- M3: interview-chat Edge Function(service_role)이 직접 select하는 두 테이블에 GRANT 보정.
-- increment_guest_usage RPC는 SECURITY DEFINER라 소유자 권한으로 실행되지만,
-- 남은 사용량 조회(읽기 전용 경로)와 한도 설정 조회는 service_role 세션이 직접 select한다.
-- 이 프로젝트는 새 테이블에 역할별 GRANT를 자동 부여하지 않으므로 명시해야 한다.

grant select on public.rate_limit_config to service_role;
grant select on public.guest_daily_usage to service_role;
