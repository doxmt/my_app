-- 비회원 일일 사용량 카운터(기기 ID·IP 해시)는 당일 한도 계산에만 쓰므로 30일이 지나면 지운다.
-- 개인정보처리방침(/privacy)의 보유기간과 같은 값이다. 바꾸면 방침도 함께 고친다.
create extension if not exists pg_cron;

-- 매일 18:00 UTC(한국 03:00). 같은 이름으로 다시 호출하면 기존 작업을 갱신한다.
select cron.schedule(
  'purge-guest-daily-usage',
  '0 18 * * *',
  $$delete from public.guest_daily_usage where usage_date < current_date - 30$$
);
