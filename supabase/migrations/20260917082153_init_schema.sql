-- M1: 스키마 전체(12개 테이블) + RLS + GRANT + pgvector
-- RPC(increment_daily_usage, increment_guest_usage)는 M3/M4에서 추가한다.

create extension if not exists vector with schema extensions;

-- =========================================================
-- 1. profiles (auth.users 확장)
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  is_admin boolean not null default false,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'paid')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;

create policy "profiles_owner_all" on public.profiles
  for all
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- =========================================================
-- 2. categories (공개 읽기, 앱에서 쓰기 불가)
-- =========================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index categories_parent_id_idx on public.categories (parent_id);

alter table public.categories enable row level security;

grant select on public.categories to anon, authenticated;

create policy "categories_public_select" on public.categories
  for select
  to anon, authenticated
  using (true);

-- =========================================================
-- 3. questions (공개 읽기: is_published만, 앱에서 쓰기 불가)
-- =========================================================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  type text not null check (type in ('descriptive', 'multiple_choice')),
  prompt text not null,
  model_answer text,
  choices jsonb,
  correct_choice_id text,
  difficulty text,
  tags text[] not null default '{}',
  is_published boolean not null default false,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create index questions_category_id_idx on public.questions (category_id);

alter table public.questions enable row level security;

grant select on public.questions to anon, authenticated;

create policy "questions_published_select" on public.questions
  for select
  to anon, authenticated
  using (is_published = true);

-- =========================================================
-- 4. question_candidates (M5 콘텐츠 파이프라인, 어드민만)
-- =========================================================
create table public.question_candidates (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  source_material text,
  source_url text,
  draft_prompt text,
  draft_model_answer text,
  embedding extensions.vector(1536),
  duplicate_of uuid references public.questions (id) on delete set null,
  similarity_score double precision,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

create index question_candidates_category_id_idx on public.question_candidates (category_id);
create index question_candidates_duplicate_of_idx on public.question_candidates (duplicate_of);
create index question_candidates_reviewed_by_idx on public.question_candidates (reviewed_by);

alter table public.question_candidates enable row level security;

grant select, insert, update, delete on public.question_candidates to authenticated;

create policy "question_candidates_admin_all" on public.question_candidates
  for all
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
-- 5. practice_attempts (회원 학습 기록, 본인만)
-- =========================================================
create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  user_answer_text text,
  self_graded_result text check (self_graded_result in ('correct', 'incorrect')),
  attempted_at timestamptz not null default now()
);

create index practice_attempts_user_id_idx on public.practice_attempts (user_id);
create index practice_attempts_question_id_idx on public.practice_attempts (question_id);

alter table public.practice_attempts enable row level security;

grant select, insert, update, delete on public.practice_attempts to authenticated;

create policy "practice_attempts_owner_all" on public.practice_attempts
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =========================================================
-- 6. wrong_notes (오답노트, 본인만)
-- =========================================================
create table public.wrong_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id uuid not null references public.questions (id) on delete cascade,
  source_attempt_id uuid references public.practice_attempts (id) on delete set null,
  note_text text,
  is_resolved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create index wrong_notes_question_id_idx on public.wrong_notes (question_id);
create index wrong_notes_source_attempt_id_idx on public.wrong_notes (source_attempt_id);

alter table public.wrong_notes enable row level security;

grant select, insert, update, delete on public.wrong_notes to authenticated;

create policy "wrong_notes_owner_all" on public.wrong_notes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =========================================================
-- 7. resumes (회원 이력서, 본인만)
-- =========================================================
create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  original_filename text,
  source_type text not null check (source_type in ('pdf', 'text')),
  extracted_text text,
  created_at timestamptz not null default now()
);

create index resumes_user_id_idx on public.resumes (user_id);

alter table public.resumes enable row level security;

grant select, insert, update, delete on public.resumes to authenticated;

create policy "resumes_owner_all" on public.resumes
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =========================================================
-- 8. interview_sessions (모의면접 세션, 본인만)
-- =========================================================
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  resume_id uuid references public.resumes (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  provider text,
  model text,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index interview_sessions_user_id_idx on public.interview_sessions (user_id);
create index interview_sessions_resume_id_idx on public.interview_sessions (resume_id);
create index interview_sessions_category_id_idx on public.interview_sessions (category_id);

alter table public.interview_sessions enable row level security;

grant select, insert, update, delete on public.interview_sessions to authenticated;

create policy "interview_sessions_owner_all" on public.interview_sessions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- =========================================================
-- 9. interview_messages (대화 메시지, 세션 소유자만)
-- =========================================================
create table public.interview_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.interview_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index interview_messages_session_id_idx on public.interview_messages (session_id);

alter table public.interview_messages enable row level security;

grant select, insert, update, delete on public.interview_messages to authenticated;

create policy "interview_messages_session_owner_all" on public.interview_messages
  for all
  to authenticated
  using (
    exists (
      select 1 from public.interview_sessions
      where interview_sessions.id = interview_messages.session_id
        and interview_sessions.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.interview_sessions
      where interview_sessions.id = interview_messages.session_id
        and interview_sessions.user_id = (select auth.uid())
    )
  );

-- =========================================================
-- 10. daily_usage (회원 일일 사용량, 본인 읽기만, 쓰기는 RPC 전용)
-- =========================================================
create table public.daily_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null,
  interview_messages_count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.daily_usage enable row level security;

grant select on public.daily_usage to authenticated;

create policy "daily_usage_owner_select" on public.daily_usage
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- =========================================================
-- 11. guest_daily_usage (비회원 일일 사용량, Edge Function(service role)만 접근)
-- =========================================================
create table public.guest_daily_usage (
  subject_type text not null check (subject_type in ('device', 'ip')),
  subject_key text not null,
  usage_date date not null,
  interview_messages_count integer not null default 0,
  primary key (subject_type, subject_key, usage_date)
);

alter table public.guest_daily_usage enable row level security;

-- GRANT/정책 없음: anon·authenticated는 접근 불가, service role만 접근한다.

-- =========================================================
-- 12. rate_limit_config (한도, 공개 읽기, 수정은 대시보드에서만)
-- =========================================================
create table public.rate_limit_config (
  tier text primary key check (tier in ('guest_device', 'guest_ip', 'free', 'paid')),
  daily_interview_messages integer not null
);

alter table public.rate_limit_config enable row level security;

grant select on public.rate_limit_config to anon, authenticated;

create policy "rate_limit_config_public_select" on public.rate_limit_config
  for select
  to anon, authenticated
  using (true);
