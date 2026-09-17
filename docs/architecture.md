# 아키텍처

## 기술 스택

- **앱**: Flutter (Android / iOS / Web), Riverpod(상태관리), go_router(라우팅)
- **백엔드**: Supabase — Postgres(+pgvector), Auth(익명 로그인 + OAuth), Edge Functions(Deno), Storage
- **LLM**: Anthropic / OpenAI — Edge Function 내부 어댑터로 교체 가능 (`LLM_PROVIDER` env var)
- **PDF 추출**: 별도 Vercel Node 서버리스 함수 (Deno에는 쓸 만한 PDF 파서가 없음)
- **어드민**: 별도 React 웹앱 (M5, 프레임워크 미정)
- **배포**: 웹은 Vercel(develop → Preview, main → Production), CI는 GitHub Actions(`flutter analyze` + `flutter test`)

## 디렉토리 구조

```
lib/
  main.dart
  app/                 router.dart, theme.dart, app_config.dart
  core/
    supabase/          Supabase 클라이언트 provider
    storage/           local_practice_store.dart (비회원 로컬 학습 기록)
    error/             Result / Failure 타입
  features/
    categories/        카테고리 탐색
    practice/          문제풀이 흐름
    wrong_notes/       오답노트
    resume/            이력서 업로드
    interview/         모의면접 채팅
    usage/             남은 사용량 표시
    auth/              OAuth 로그인 (M4에서 추가)

supabase/
  migrations/          스키마, RLS, RPC
  functions/
    interview-chat/    모의면접 + LLM 어댑터
    content-pipeline/  문제 수집 → 초안 → 중복 비교 (M5)

admin/                 React 어드민 웹앱 (M5)
```

## 패턴

- **feature-first + 3계층**: 각 feature는 `data/`(Supabase 구현) · `domain/`(순수 Dart 모델, 리포지토리 인터페이스) · `presentation/`(위젯, Riverpod provider)로 나눈다. domain은 Supabase 없이 단위 테스트한다.
- **LLM 호출은 서버에서만**: 앱은 Edge Function만 호출하고, API 키는 Supabase secrets에만 둔다.
- **LLM 어댑터**: `LlmProvider` 인터페이스(`streamChat`) + `AnthropicProvider` / `OpenAiProvider`, `factory.ts`가 env var로 선택.
- **콘텐츠 쓰기는 앱에서 불가**: `categories` / `questions`는 공개 읽기 전용. 새 문제는 어드민 승인 흐름(`question_candidates` → `questions`)으로만 들어간다. M5 이전에는 SQL 시드 스크립트로 넣는다.

## 데이터 모델

| 테이블 | 용도 | 접근 |
|---|---|---|
| `profiles` | auth.users 확장 (`is_anonymous`, `is_admin`, `plan_tier`, `stripe_customer_id`) | 본인만 |
| `categories` | 카테고리 (`parent_id`로 하위 분류) | 공개 읽기 |
| `questions` | 문제 (`type`, `prompt`, `model_answer`, `embedding vector(1536)`) | 공개 읽기 |
| `question_candidates` | 수집된 문제 후보 (`duplicate_of`, `similarity_score`, `status`) | 어드민만 |
| `practice_attempts` | 답변 시도 기록 | 본인만 |
| `wrong_notes` | 오답노트 (`unique(user_id, question_id)`) | 본인만 |
| `resumes` | 이력서 (`source_type`, `extracted_text`, `extraction_status`) | 본인만 |
| `interview_sessions` | 모의면접 세션 (`provider`, `model`, `status`) | 본인만 |
| `interview_messages` | 대화 메시지 | 세션 소유자만 (join 정책) |
| `daily_usage` | 일일 사용량 `PK(user_id, usage_date)` | 본인 읽기만, 쓰기는 RPC |
| `rate_limit_config` | tier별 일일 한도 (`anonymous` / `free` / `paid`) | 공개 읽기, 대시보드에서만 수정 |

사용량 증가는 `increment_daily_usage(p_user_id, p_limit)` SECURITY DEFINER 함수 하나로 처리한다. `update ... where count < limit` 한 문장으로 체크와 증가를 같이 해서 동시 요청에도 한도를 넘지 않는다.

## 데이터 흐름

```
[문제풀이 — 비회원]
카테고리/문제 조회(Supabase 공개 읽기) → 답변 작성 → 모범답안 확인 → 자가 채점
  → (버튼) 오답노트 저장 → 기기 로컬 저장소

[모의면접]
기능 진입 → signInAnonymously() (최초 1회)
  → 이력서 입력: 텍스트(즉시 저장) | PDF(Storage 업로드 → Vercel 파싱 함수 → extracted_text)
  → 메시지 전송 → Edge Function interview-chat
      → JWT로 user_id 확인 → increment_daily_usage (초과 시 429)
      → 이력서 + 카테고리 + 대화 이력으로 프롬프트 구성
      → LlmProvider.streamChat → 스트리밍 응답 → interview_messages 저장

[회원가입 — M4]
OAuth 로그인 → linkIdentity로 익명 계정 승격 (데이터 유지)
  → 로컬 학습 기록을 practice_attempts / wrong_notes로 업로드 → tier: anonymous → free

[콘텐츠 수집 — M5]
어드민 버튼 or 커맨드 → 자료 입력 → LLM 문제 초안 → 임베딩 → pgvector 유사도 비교
  → question_candidates(pending) → 어드민 승인 → questions(is_published)
```

## 네이밍 규칙

- **파일/디렉토리 (Dart)**: snake_case (`local_practice_store.dart`)
- **클래스/위젯**: PascalCase (`PracticePage`)
- **함수/변수**: camelCase (`fetchQuestions`)
- **Riverpod provider**: camelCase + `Provider` 접미사 (`authStateProvider`)
- **DB 테이블/컬럼**: snake_case, 테이블은 복수형 (`interview_sessions`)
- **Edge Function 디렉토리**: kebab-case (`interview-chat`)
