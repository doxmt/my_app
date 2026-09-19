-- M5-a: 어드민 계정 생성 등 service_role이 직접 profiles를 다뤄야 하는 운영 작업을 위한 GRANT 보정.
-- 이 프로젝트는 새 테이블에 역할별 GRANT를 자동 부여하지 않으므로 명시해야 한다.

grant select, insert, update, delete on public.profiles to service_role;
