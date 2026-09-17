# 개발자 면접 준비 앱 — 아키텍처 & 빌드 플랜

> 프로젝트 전체 설계를 한 곳에 모은 기준 문서다. `docs/prd.md`, `docs/architecture.md`, `docs/adr.md`, `docs/roadmap.md`는 이 내용을 주제별로 나눈 것이므로, 설계가 바뀌면 이 문서와 해당 문서를 함께 고친다.

## Context

`my_app`은 Flutter 프로젝트로, 웹 배포(Vercel)와 CI(GitHub Actions)가 연결되어 있다. 만들 제품은 **개발자 기술면접 준비를 도와주는 Android/iOS/Web 앱**이다.

핵심 기능:
1. 분야별(카테고리) 서술형 문제 학습 — 답변 작성 → 모범답안 확인 → 정답/오답 자가 채점 → 오답노트 저장
2. 이력서(PDF/텍스트) 기반 AI 모의면접 — LLM과 대화형으로 실제 면접처럼 진행
3. OAuth 회원가입(Google/Apple/GitHub/Kakao) — 비회원은 로그인 없이 바로 쓰되 모의면접 사용량을 하루 소량만, 회원은 더 넉넉하게(현재 무료, 추후 결제로 무제한 고려 — 이번 범위 밖)
4. 어드민 콘텐츠 파이프라인 — 자료 수집 → AI 문제 초안 → 중복 비교 → 관리자 승인 → 게시

**개발 순서 (사용자 결정)**: 핵심 학습/면접 기능 → OAuth 회원가입 → 어드민+콘텐츠 자동화 → 폴리시.

각 마일스톤은 하네스 워크플로우(`/plan` → `/start` → `/submit` → `/finish`)로 진행한다. 이 문서는 `/plan` 실행 시 참고할 상위 설계 문서다.

## 확정된 기술 결정

| 영역 | 선택 | 이유 |
|---|---|---|
| 백엔드 | **Supabase** (Postgres + Auth + Edge Functions) | OAuth 4종 내장, RLS로 사용자별 데이터 격리, `supabase_flutter` 크로스플랫폼 지원 |
| 상태관리 | **Riverpod** | 비동기 호출·스트리밍 채팅을 `AsyncNotifier`/`StreamProvider`로 처리, 보일러플레이트 적음 |
| 라우팅 | **go_router** | 웹 URL, 인증 가드 redirect |
| LLM | **Anthropic + OpenAI, 어댑터로 교체 가능** | Edge Function 안에 `LlmProvider` 인터페이스 + 두 어댑터, `LLM_PROVIDER` env var로 선택 |
| 비회원 처리 | **로그인 없음(익명 로그인도 안 씀). 데이터는 기기에만, 한도는 기기 ID + IP** | 사용자 요청: 비회원은 바로 사용. 서버에 비회원 데이터를 두지 않아 신뢰할 수 없는 기기 ID로 조회하는 경로가 없음. 기기 ID만으로는 앱 초기화로 한도가 풀려서 IP 한도를 함께 건다 |
| OAuth | Google, Apple, GitHub, Kakao (계정 모두 준비됨) | 구현은 M4 |
| 이력서 추출 | 텍스트 붙여넣기 기본. PDF는 앱이 Vercel Node 함수(`pdf-parse`/`unpdf`)로 직접 보내 텍스트만 받음, 원본 저장 안 함 | Deno엔 PDF 파서가 없고, 비회원은 Storage에 올릴 수 없음 |
| 결제 | 미구현. `profiles.plan_tier`, `stripe_customer_id`(nullable)만 추가 | 나중에 마이그레이션 없이 붙이기 위해 |
| 어드민 | **React 웹앱**, 별도 배포, 같은 Supabase 프로젝트 | 내부 도구라 Flutter일 필요 없음 |
| 콘텐츠 수집 | 자료 수집 → AI 초안 → 임베딩 중복 비교 → 승인 → 게시. 어드민 버튼 또는 커맨드로 실행 | 사용자가 자동화를 원함 |

**Supabase 프로젝트** (2026-09-17 생성): ref `bmewpbkllmlikzqkxalw`, 리전 Tokyo, URL `https://bmewpbkllmlikzqkxalw.supabase.co`. 설정: Data API 켬, 새 테이블 자동 노출 끔(테이블별 `GRANT` 필요), 자동 RLS 켬(공개 테이블도 select 정책 필요).

## 데이터 모델 (Supabase Postgres)

```sql
-- 회원 프로필 (auth.users 확장)
profiles(
  id uuid PK references auth.users,
  display_name text, avatar_url text,
  is_admin boolean not null default false,
  plan_tier text default 'free',             -- 'free' | 'paid'(미사용)
  stripe_customer_id text,                   -- nullable, 결제 대비
  created_at, updated_at
)

-- 콘텐츠 (공개 읽기, 앱에서 쓰기 불가)
categories(id, parent_id → categories, slug unique, name, description, sort_order)
questions(id, category_id → categories, type['descriptive'|'multiple_choice'],
          prompt, model_answer, choices jsonb, correct_choice_id, difficulty, tags text[],
          is_published, embedding vector(1536))

-- 콘텐츠 수집 파이프라인 (M5, 어드민만)
question_candidates(
  id uuid PK, category_id → categories,
  source_material text, source_url text,
  draft_prompt text, draft_model_answer text,
  embedding vector(1536),
  duplicate_of uuid → questions, similarity_score float,
  status ['pending'|'approved'|'rejected'] default 'pending',
  created_at, reviewed_at, reviewed_by → auth.users
)

-- 회원 학습 기록 (RLS: auth.uid() = user_id)
practice_attempts(id, user_id, question_id, user_answer_text, self_graded_result['correct'|'incorrect'], attempted_at)
wrong_notes(id, user_id, question_id, source_attempt_id, note_text, is_resolved, unique(user_id, question_id))

-- 회원 이력서 & 모의면접 (RLS: auth.uid() = user_id)
resumes(id, user_id, original_filename, source_type['pdf'|'text'], extracted_text, created_at)
interview_sessions(id, user_id, resume_id, category_id, provider, model,
                    status['active'|'completed'|'abandoned'], started_at, ended_at)
interview_messages(id, session_id → interview_sessions, role['user'|'assistant'|'system'], content, created_at)
                    -- RLS: 세션 소유자인지 join으로 확인

-- 사용량
daily_usage(user_id, usage_date, interview_messages_count, PK(user_id, usage_date))        -- 회원
guest_daily_usage(subject_type['device'|'ip'], subject_key, usage_date, interview_messages_count,
                  PK(subject_type, subject_key, usage_date))                                -- 비회원, IP는 해시
rate_limit_config(tier PK ['guest_device'|'guest_ip'|'free'|'paid'], daily_interview_messages)
```

**접근 원칙**
- 회원 데이터 테이블: `auth.uid() = user_id`로 본인 것만.
- `categories`/`questions`: 공개 읽기 전용 (`GRANT select` + select 정책).
- `question_candidates`: `profiles.is_admin = true`만.
- `guest_daily_usage`: 클라이언트 권한 없음, Edge Function만 접근.
- `rate_limit_config`: 공개 읽기, 수정은 대시보드에서만.
- 사용량 증가는 SECURITY DEFINER RPC로만:
  - `increment_daily_usage(p_user_id, p_limit)` — `update ... where count < limit` 한 문장으로 체크+증가
  - `increment_guest_usage(p_device_key, p_ip_key, p_device_limit, p_ip_limit)` — 기기·IP 두 행을 잠그고 둘 다 한도 안일 때만 둘 다 증가

## 기능별 흐름

**1) 카테고리 문제풀이 + 오답노트**
- `categories`/`questions`는 로그인 없이 조회
- 비회원: 답변·자가채점·오답노트 전부 기기 로컬 저장
- 오답노트 저장은 사용자가 누르는 버튼 (맞힌 문제도 저장 가능)

**2) 이력서 입력**
- 텍스트 붙여넣기 → 그대로 사용
- PDF → Vercel 파싱 함수로 직접 전송 → 텍스트 반환 (함수에 파일 크기·호출 제한)
- 비회원은 기기에 저장, 회원은 `resumes`에 저장

**3) 모의면접**
- 비회원: 요청에 publishable key + `X-Device-Id` 헤더, 본문에 이력서 텍스트·카테고리·이전 대화 → Edge Function `interview-chat`이 기기 ID·IP 해시로 `increment_guest_usage`(초과 시 429) → 대화 길이 제한 확인 → 프롬프트 구성 → `LlmProvider.streamChat` 스트리밍 → 앱이 대화를 기기에 저장 (서버엔 사용량만)
- 회원(M4 이후): JWT로 user_id 확인 → `increment_daily_usage` → DB의 이력서·대화로 프롬프트 → 스트리밍 → `interview_messages` 저장

**4) 회원가입 (M4)**
- OAuth 로그인 → 기기의 학습 기록·오답노트·이력서·면접 대화를 DB로 업로드(중복 방지) → 로컬 사본 삭제 → 한도 `free` 적용

**5) 콘텐츠 수집 파이프라인 (M5)**
- 트리거: 어드민 버튼 또는 커맨드 (같은 백엔드 로직 호출)
- 자료 입력(1차는 관리자가 원문 붙여넣기) → LLM이 서술형 문제+모범답안 초안 → OpenAI 임베딩 → pgvector로 기존 `questions`와 유사도 비교 → 임계값 이상이면 `duplicate_of` 기록 → `question_candidates(pending)` → 어드민에서 확인·수정 → 승인 시 `questions` 게시, 반려 시 `rejected`

## 프로젝트 구조

```
lib/
  app/            router.dart, theme.dart, app_config.dart
  core/
    supabase/     Supabase 클라이언트 provider
    device/       device_id.dart (최초 실행 시 UUID 생성·보관)
    storage/      비회원 로컬 저장 (학습 기록, 이력서, 면접 대화)
    error/        Result/Failure 타입
  features/
    categories/  practice/  wrong_notes/  resume/  interview/  usage/
    auth/         (M4) OAuth 로그인

supabase/
  migrations/     스키마 + RLS + GRANT + RPC
  functions/
    interview-chat/     LLM 어댑터 2종 (M3), 회원 경로 (M4)
    content-pipeline/   수집→초안→중복비교 (M5)

admin/            React 어드민 웹앱 (M5)
```
각 feature는 `data/domain/presentation` 3계층. 리포지토리는 로컬 구현과 Supabase 구현을 두고 로그인 여부로 선택.

## 주요 패키지 (Flutter)

`supabase_flutter`, `flutter_riverpod`, `go_router`, `file_picker`, `shared_preferences`(기기 ID·로컬 저장). M4에서 `google_sign_in`, `sign_in_with_apple` 추가 (GitHub/Kakao는 `signInWithOAuth`).

## 마일스톤

- **M0. 정리 + 문서화** ✅ — 데스크톱 플랫폼 폴더 삭제, `CLAUDE.md`와 `docs/` 작성
- **M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대** — `supabase init`/`link`, 스키마·RLS·GRANT 마이그레이션(pgvector 포함), `supabase_flutter`/`flutter_riverpod`/`go_router` 연결, 기기 ID 생성, 기본 라우트. 완료 기준: 세 플랫폼에서 로그인 없이 카테고리 목록 조회
- **M2. 카테고리/문제풀이 + 로컬 오답노트** — SQL 시드로 테스트 문제 삽입, 문제풀이 흐름, 로컬 오답노트. 완료 기준: 재시작 후에도 기록 유지
- **M3. 이력서 입력 + 모의면접 (비회원)** — 텍스트/PDF(Vercel 함수) 입력, 기기 저장, `interview-chat`(어댑터 2종, 대화 길이 제한, 스트리밍), `increment_guest_usage`, 채팅 UI. 완료 기준: 로그인 없이 이력서 기반 대화, 기기·IP 한도 초과 시 429, `LLM_PROVIDER`로 전환
- **M4. OAuth 회원가입** — 4종 로그인, 기기 데이터 DB 업로드, `interview-chat` 회원 경로, `free` 한도. 완료 기준: 비회원 기록이 가입 후 계정에 남고 타인 데이터는 안 보임
- **M5. 어드민 + 콘텐츠 자동화** — React 어드민(별도 배포, `is_admin`), `content-pipeline`, 후보 검토·승인 UI, 커맨드 실행 지원. 완료 기준: 중복 후보에 `duplicate_of`, 승인 문제가 앱에 바로 노출
- **M6. 폴리시/QA** — 로딩·에러·빈 상태, 3개 플랫폼 전체 여정 점검, 플랫폼별 특이사항을 `CLAUDE.md`에 기록, 릴리즈 시 `main` push

## 보류된 결정

- 일일 한도 숫자 (`guest_device`, `guest_ip`, `free`) — `rate_limit_config`로 언제든 조정
- 카테고리 목록 — M2 시드 작성 시
- 면접 세션 종료/턴 제한, 비회원 대화 이력 최대 길이 — M3 구현 중
- PDF 파싱 라이브러리(`pdf-parse` vs `unpdf`), 파싱 함수 호출 제한 방식 — M3 시작 시
- 자료 수집 소스(수동 입력 vs 자동 수집) — M5 시작 시, 우선 수동 입력
- 어드민 프레임워크(Next.js vs Vite+React) — M5 시작 시
- 중복 판정 임계값, 임베딩 모델 — M5 구현 중
- 디자인 방향 — M1 화면 작업 전

## Verification

- 매 마일스톤: `flutter analyze` + `flutter test`, 대상 플랫폼에서 직접 시나리오 확인, develop push 후 Vercel Preview 확인
- M1: 로그인 없이 공개 테이블 조회됨, 권한 없는 테이블(`guest_daily_usage`, `question_candidates`)은 publishable key로 접근 거부됨
- M3: `LLM_PROVIDER` 전환, 기기 한도·IP 한도 각각 429, 동시 요청에도 한도 초과 없음, 과도하게 긴 대화 이력 거부
- M4: 가입 후 기기 기록이 계정에 반영(중복 없음), 다른 계정으로 RLS 차단 확인
- M5: 중복 후보에 `duplicate_of` 채워짐, 승인 시 `questions`에 정확히 반영
