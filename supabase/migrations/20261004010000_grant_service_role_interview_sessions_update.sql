-- interview-chat(service_role)이 새 면접을 시작할 때 이전 진행 중 세션을 completed로 바꾼다.
-- 지금까지는 select/insert만 있어 세션이 영원히 active로 남았다.
grant update on public.interview_sessions to service_role;
