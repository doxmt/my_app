-- M5-a: 어드민이 categories/questions를 쓰고, 미게시 questions를 조회할 수 있도록 권한을 연다.
-- question_candidates는 이미 question_candidates_admin_all 정책 + GRANT가 있어 변경하지 않는다.

-- =========================================================
-- categories: 공개 select는 유지, admin insert/update 추가
-- =========================================================
grant insert, update on public.categories to authenticated;

create policy "categories_admin_insert" on public.categories
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

create policy "categories_admin_update" on public.categories
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

-- =========================================================
-- questions: 공개 select(is_published=true)는 유지, admin은 미게시 포함 전체 select + insert/update 추가
-- =========================================================
grant insert, update on public.questions to authenticated;

create policy "questions_admin_select" on public.questions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

create policy "questions_admin_insert" on public.questions
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

create policy "questions_admin_update" on public.questions
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

-- =========================================================
-- approve_question_candidate: 후보 승인을 questions 삽입 + 후보 status 갱신 한 트랜잭션으로 처리
-- 어드민 웹앱이 authenticated 사용자로 직접 호출하므로 함수 내부에서 is_admin을 확인한다.
-- =========================================================
create or replace function public.approve_question_candidate(
  p_candidate_id uuid,
  p_category_id uuid,
  p_type text,
  p_prompt text,
  p_model_answer text,
  p_choices jsonb,
  p_correct_choice_id text,
  p_difficulty text,
  p_tags text[],
  p_is_published boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_question_id uuid;
begin
  if not exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ) then
    raise exception 'not authorized';
  end if;

  insert into public.questions (
    category_id, type, prompt, model_answer, choices, correct_choice_id, difficulty, tags, is_published
  )
  values (
    p_category_id, p_type, p_prompt, p_model_answer, p_choices, p_correct_choice_id, p_difficulty, p_tags, p_is_published
  )
  returning id into v_question_id;

  update public.question_candidates
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = p_candidate_id;

  return v_question_id;
end;
$$;

revoke all on function public.approve_question_candidate(uuid, uuid, text, text, text, jsonb, text, text, text[], boolean) from public;
grant execute on function public.approve_question_candidate(uuid, uuid, text, text, text, jsonb, text, text, text[], boolean) to authenticated;
