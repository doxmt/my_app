-- 이력서에 자기소개(면접을 자기소개로 시작할 때 쓰는 텍스트, 최대 1500자는 클라이언트에서 제한) 컬럼을 추가한다.
-- 테이블 단위 GRANT(authenticated)와 RLS 정책 resumes_owner_all이 이미 있어 새 컬럼에 별도 권한·정책은 필요 없다.
alter table public.resumes add column self_introduction text;
