-- Supabase 보안·성능 점검(advisor) 지적 사항 정리.

-- 1) 트리거 전용 SECURITY DEFINER 함수는 API(/rest/v1/rpc)로 호출할 이유가 없다.
--    트리거는 실행 시점에 EXECUTE 권한을 확인하지 않으므로 회수해도 동작은 그대로다.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- rls_auto_enable은 대시보드의 "새 테이블에 RLS 자동 적용" 기능이 만든 이벤트 트리거 함수라
-- 마이그레이션에 정의가 없다. 있을 때만 회수한다.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end
$$;

-- 2) questions의 authenticated select 정책이 2개(게시된 문제 / 어드민 전체)라 조회마다 둘 다 평가됐다.
--    역할별로 하나씩만 남긴다. 보이는 행은 이전과 같다.
drop policy "questions_published_select" on public.questions;
drop policy "questions_admin_select" on public.questions;

create policy "questions_published_select" on public.questions
  for select
  to anon
  using (is_published = true);

create policy "questions_member_select" on public.questions
  for select
  to authenticated
  using (
    is_published = true
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );
