-- 보안 수정: 일반 회원(authenticated)이 자기 프로필의 is_admin, plan_tier, stripe_customer_id를 바꿔
-- 어드민 권한이나 요금제를 스스로 올릴 수 있었다(테이블 단위 update/insert/delete GRANT + "내 행이면 모두 허용" 정책).
-- 프로필 행은 handle_new_user 트리거(SECURITY DEFINER)가 만들고, 어드민 지정·요금제 변경은 service_role/대시보드에서만 한다.
-- 따라서 회원에게는 insert/delete 권한을 주지 않고, update는 표시 정보 두 컬럼으로만 제한한다.
-- (RLS 정책 profiles_owner_all은 그대로 두며, 권한이 없는 컬럼·동작은 정책과 무관하게 거부된다.)
revoke insert, update, delete, truncate, references, trigger on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
