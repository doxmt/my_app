# 아키텍처

## 기술 스택

- **앱**: Flutter (Android / iOS), Riverpod(상태관리), go_router(라우팅). Web은 Flutter 웹 빌드가 컷오버 전까지 Production, 컷오버 후에는 아래 Next.js 웹이 대체한다 (ADR-019)
- **웹**: `webapp/` Next.js 16 (App Router, TypeScript, Tailwind v4 + shadcn/ui, Vitest). 클라이언트 컴포넌트 중심, 비회원 데이터는 localStorage. Supabase는 `@supabase/ssr`(브라우저 `createBrowserClient`, 서버 `createServerClient`), 세션 갱신은 `proxy.ts`(`getClaims()`). env는 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `ALLOWED_ORIGINS`(PDF 함수 CORS)
- **백엔드**: Supabase — Postgres(+pgvector), Auth(OAuth: Google/GitHub/Kakao, ADR-022), Edge Functions(Deno)
- **LLM**: Anthropic / OpenAI — Edge Function 내부 어댑터로 교체 가능 (`LLM_PROVIDER` env var)
- **PDF 추출**: Vercel Node 서버리스 함수 (`unpdf` 라이브러리). 컷오버 전에는 루트 `api/parse-pdf.ts`(Flutter 웹과 함께 배포), 이후에는 `webapp/app/api/parse-pdf/route.ts`(Route Handler, raw 바이트 본문, 같은 경로 `/api/parse-pdf`)가 이어받고 모바일 앱도 이 엔드포인트를 쓴다
- **어드민**: 별도 웹앱, Vite + React + TypeScript, Tailwind v4 + shadcn/ui (M5-a). 로그인은 고정 관리자 계정 + 비밀번호 전용 화면(`signInWithPassword` 내부 호출, ADR-016)
- **배포**: 웹은 Vercel(develop → Preview, main → Production, path URL 전략 + SPA rewrite), CI는 GitHub Actions(`flutter analyze` + `flutter test`). PR에는 CI·Vercel 배포 결과를 한글 요약 댓글 하나로 갱신(`.github/scripts/pr-summary.js`, `ci.yml` + `pr-deploy.yml`의 `deployment_status`), Vercel 봇 댓글은 끔. GitHub 기본 브랜치는 `develop`. M6부터 CI에 `webapp` 잡(`npm ci` → lint → `tsc --noEmit` → test → build)이 추가되고, 루트 Vercel 프로젝트의 Root Directory가 `webapp/`이 되면 develop Preview는 Next만 빌드한다(루트 `vercel.json`의 Flutter 빌드 설정은 그대로 적용되므로 `webapp/vercel.json`으로 덮어쓴다). Production은 컷오버(develop → main 릴리즈 push) 전까지 기존 Flutter 웹 배포 그대로
- **화면**: 모바일(Flutter)은 하단 탭 3개(홈 `/` · 모의면접 `/interview` · 내 정보 `/me`), `StatefulShellRoute.indexedStack`. 웹(Next)은 PC 기준 웹사이트 구조 — sticky 상단 내비(문제풀이/모의면접/오답노트/이력서 + 로그인·계정 메뉴), 본문 최대 1200px, 푸터, 1024px 미만은 햄버거 메뉴. 내 정보 영역은 좌측 서브 메뉴(내 정보/이력서/오답노트) (ADR-019)
- **설정**: Supabase URL/publishable key, PDF 파싱 함수 오리진(`PDF_PARSE_BASE_URL`)은 `String.fromEnvironment`로 읽음. 로컬은 `--dart-define-from-file=env/dev.json`(gitignore), Vercel은 환경변수를 `--dart-define`으로 전달(`PDF_PARSE_BASE_URL`은 Vercel이 자동 주입하는 `$VERCEL_URL`로 배포마다 자기 자신을 가리킴) (CI는 불필요). Next 웹의 env는 `webapp/.env.local`(gitignore, 이름은 `webapp/.env.local.example`) / Vercel 환경변수. 컷오버 후 Flutter 웹 빌드가 사라지므로 `PDF_PARSE_BASE_URL`은 모바일 빌드용으로만 남고, 웹 도메인이 유지되면 값 변경이 필요 없다
- **마이그레이션**: 원격 Supabase에 `supabase db push`로 적용. 로컬 Docker는 쓰지 않음

## 디렉토리 구조

```
lib/
  main.dart
  app/                 router.dart, theme.dart, app_config.dart
  core/
    supabase/          Supabase 클라이언트 provider
    device/            device_id.dart (최초 실행 시 UUID 생성·보관)
    storage/           비회원 로컬 저장 (오답노트, 이력서, 면접 대화)
    error/             Result / Failure 타입
    theme/             theme_mode_provider.dart (라이트/다크 저장·상태, 기본 라이트)
    speech/            dictation.dart(순수 로직), dictation_button.dart (마이크 음성 입력)
  features/
    categories/        카테고리 탐색
    practice/          문제풀이 흐름
    wrong_notes/       오답노트
    resume/            이력서 입력
    interview/         모의면접 채팅 (남은 사용량 배너 포함)
    auth/              OAuth 로그인 (Google/GitHub), 로그인 시 로컬 데이터(오답노트·이력서) 자동 이전

api/                   Vercel Node 서버리스 함수 (parse-pdf.ts, PDF 텍스트 추출). Root Directory가 `webapp/`이 되면 빌드에서 쓰이지 않으며 컷오버 안정화 후 정리

webapp/                Next.js 웹 클라이언트 (M6). 기존 루트 Vercel 프로젝트의 Root Directory=webapp/
  app/                 라우트: / · /categories/... · /interview · /me · /me/login · /me/resume · /me/wrong-notes/... · /auth/callback · /api/parse-pdf
  components/          화면(views/), 앱 셸(상단 내비 + 푸터, 좁은 화면은 햄버거), UserIdProvider, theme-toggle/setting/sync(화면 모드), mic-button(음성 입력)
  lib/                 supabase/(client·server·proxy), storage/(localStorage, Flutter 호환 형식), data/(로컬·Supabase 리포지토리), auth/(로컬→DB 이전, 안전한 next 경로), interview/(SSE 파서, 채팅 클라이언트), theme.ts·theme-client.ts(화면 모드), speech.ts(음성 입력 순수 로직)

supabase/
  migrations/          스키마, RLS, GRANT, RPC
  functions/
    interview-chat/    모의면접 + LLM 어댑터
    content-pipeline/  문제 수집 → 초안 → 중복 비교 (M5)

admin/                 Vite+React 어드민 웹앱 (M5-a), 별도 Vercel 프로젝트(Root Directory=admin/)로 배포
```

## 패턴

- **feature-first + 3계층**: 각 feature는 `data/`(Supabase·로컬 구현) · `domain/`(순수 Dart 모델, 리포지토리 인터페이스) · `presentation/`(위젯, Riverpod provider)로 나눈다. domain은 Supabase 없이 단위 테스트한다.
- **비회원은 로그인 없음**: 비회원은 Supabase Auth 세션이 없다. 데이터(학습 기록, 이력서, 면접 대화)는 전부 기기에 저장하고, 서버에는 사용량 카운터만 남긴다. 리포지토리는 "로컬 구현"과 "Supabase 구현"을 두고 로그인 여부로 고른다.
- **리포지토리 분기는 `userId`만으로**: 로그인 여부 판단은 `Session` 객체 전체가 아니라 `currentUserIdProvider`(`String? userId`)로 한다. `Session`을 watch하면 토큰 갱신마다 provider가 rebuild되어 화면이 깜빡인다. 로그인 성공 시 로컬→DB 데이터 이전이 끝날 때까지 이 provider는 null을 유지해, 이전 도중 화면이 회원 리포지토리로 전환되지 않게 한다. `profiles` 행은 `auth.users` insert 트리거(`handle_new_user`)로 자동 생성한다.
- **기기 ID**: 최초 실행 시 UUID를 만들어 로컬에 보관하고 Edge Function 호출 때 `X-Device-Id` 헤더로 보낸다. 서버는 이 값을 신뢰하지 않고 한도 계산 키로만 쓴다.
- **LLM 호출은 서버에서만**: 앱은 Edge Function만 호출하고, API 키는 Supabase secrets에만 둔다.
- **LLM 어댑터**: `LlmProvider` 인터페이스(`streamChat`) + `AnthropicProvider` / `OpenAiProvider`, `factory.ts`가 env var로 선택. Flutter 클라이언트는 `interview-chat`을 `package:http`로 Function URL에 직접 POST해 스트림을 수동 파싱한다 (`supabase_flutter`의 `functions.invoke`는 스트리밍 미지원).
- **콘텐츠 쓰기는 앱에서 불가, 어드민에서만**: `categories` / `questions`는 일반 사용자에게 공개 읽기 전용(RLS `..._public_select`, `questions`는 `is_published=true`만). 쓰기와 미게시 조회는 `profiles.is_admin=true`인 어드민 RLS 정책으로만 허용한다(M5-a). 새 문제는 어드민 직접 작성 또는 승인 흐름(`question_candidates` → `approve_question_candidate` RPC → `questions`) 두 경로로 들어가며, 같은 에디터 폼을 공유한다. M5-a 이전에는 SQL 시드로만 넣었다.
- **권한은 명시적으로**: 프로젝트 설정상 새 테이블이 Data API에 자동 노출되지 않고 RLS가 자동으로 켜진다. 마이그레이션마다 `GRANT`와 RLS 정책(공개 테이블의 select 포함)을 직접 작성한다. **RLS는 행 단위일 뿐 컬럼을 구분하지 못한다.** 회원이 자기 행을 수정할 수 있는 테이블에 `is_admin`·`plan_tier`처럼 권한을 정하는 컬럼이 있으면 테이블 단위 `GRANT update` 대신 컬럼 단위 `GRANT update (display_name, avatar_url)`로 제한한다(`profiles`, ADR-024). 한도 예외처럼 회원이 건드리면 안 되는 데이터는 `usage_overrides`처럼 service_role만 읽는 별도 테이블에 둔다.
- **홈 분야 카드 아이콘**: 각 분야의 아이콘은 `categories.slug` → `IconData` 매핑을 Flutter 앱 코드에서만 처리한다. DB 컬럼 추가 없음. 새 분야 추가 시마다 앱 매핑 코드를 업데이트하고 배포해야 한다.
- **화면 모드(라이트/다크)**: 웹·앱 모두 기본은 **라이트**이고 기기 설정을 따르지 않는다. 사용자가 라이트/다크를 골라 바꾸며 기기별로 저장한다(웹 `localStorage`의 `theme` + `<html>`의 `dark` 클래스를 첫 페인트 전 인라인 스크립트로 적용, 앱 `SharedPreferences`의 `theme_mode`를 `main`에서 미리 읽어 `initialThemeModeProvider`로 주입). 색 토큰은 CSS(`webapp/app/globals.css`)와 Dart(`lib/app/theme.dart`)에 같은 값으로 따로 있으므로 한쪽을 바꾸면 다른 쪽도 맞춘다 (ADR-020).
- **음성 입력**: 모의면접 입력창과 문제풀기 답변창에서 마이크로 입력한다. 웹은 브라우저 Web Speech API, 앱은 `speech_to_text`(기기 내장 음성인식)를 쓰고, 인식된 글을 입력창 뒤에 채운 뒤 사용자가 확인하고 직접 전송한다. 오디오를 앱 서버(Edge Function)로 보내지 않으므로 STT용 LLM 호출·키가 필요 없다 (ADR-021).
- **딥링크**: iOS는 `CFBundleURLTypes`, Android는 intent-filter에 커스텀 스킴(reverse-domain 형식)을 등록하고, 앱에서 `go_router`의 deep link 처리로 대응한다. 스킴 값은 이번 작업(Apple/Kakao 로그인) 계획 단계에서 확정한다.

## 데이터 모델

| 테이블 | 용도 | 접근 |
|---|---|---|
| `profiles` | auth.users 확장 (`is_admin`, `plan_tier`, `stripe_customer_id`) | 본인만 |
| `categories` | 카테고리 (`parent_id`로 하위 분류) | 공개 읽기, 쓰기는 어드민만 |
| `questions` | 문제 (`type`, `prompt`, `model_answer`, `embedding vector(1536)`) | 공개 읽기(게시된 것만), 어드민은 미게시 포함 전체 읽기·쓰기 |
| `question_candidates` | 수집된 문제 후보 (`duplicate_of`, `similarity_score`, `status`) | 어드민만 |
| `practice_attempts` | 답변 시도 기록 (회원) | 본인만 |
| `wrong_notes` | 오답노트 (회원, `unique(user_id, question_id)`) | 본인만 |
| `resumes` | 이력서 (회원, `source_type`, `extracted_text`, `self_introduction`) | 본인만 |
| `interview_sessions` | 모의면접 세션 (회원, `provider`, `model`, `status`) | 본인만 |
| `interview_messages` | 대화 메시지 (회원) | 세션 소유자만 (join 정책) |
| `daily_usage` | 회원 일일 사용량 `PK(user_id, usage_date)` | 본인 읽기만, 쓰기는 RPC |
| `guest_daily_usage` | 비회원 일일 사용량 `PK(subject_type, subject_key, usage_date)`, `subject_type`은 `device`/`ip`, IP는 해시로 저장 | 클라이언트 접근 없음 (Edge Function만) |
| `rate_limit_config` | 한도 (`guest_device` / `guest_ip` / `free` / `paid`) | 공개 읽기, 대시보드에서만 수정 |

사용량 증가는 SECURITY DEFINER 함수로만 한다.
- `increment_daily_usage(p_user_id, p_limit)`: 회원용. `update ... where count < limit` 한 문장으로 체크와 증가를 같이 한다.
- `increment_guest_usage(p_device_key, p_ip_key, p_device_limit, p_ip_limit)`: 비회원용. 기기·IP 두 행을 잠그고 둘 다 한도 안일 때만 둘 다 증가시킨다.

어드민 후보 승인도 같은 스타일의 SECURITY DEFINER 함수로 한다.
- `approve_question_candidate(...)`: 어드민 웹앱이 authenticated 사용자로 직접 호출하므로(service_role 아님) 함수 내부에서 `profiles.is_admin`을 확인한 뒤, `questions` insert와 후보 `status='approved'` 갱신을 한 함수 호출 안에서 원자적으로 처리한다(M5-a).

IP 한도는 같은 IP를 여러 사람이 쓰는 경우(학교, 회사)를 고려해 기기 한도보다 넉넉하게 잡는다.

## 데이터 흐름

```
[문제풀이 — 비회원]
카테고리/문제 조회(Supabase 공개 읽기) → 답변 작성 → 모범답안 확인 → 자가 채점
  → (버튼) 오답노트 저장 → 기기 로컬 저장소

[이력서 입력]
텍스트 붙여넣기 → 그대로 사용
PDF → Vercel 파싱 함수(`/api/parse-pdf`)로 직접 전송 → 추출된 텍스트 반환 (웹은 같은 오리진, 모바일 앱은 `PDF_PARSE_BASE_URL`)
  → 비회원: 기기에 저장 / 회원: resumes 테이블에 저장
자기소개: 이력서에서 "자기소개" 섹션을 규칙으로 찾아(앱·웹 동일 추출기) 칸을 채우고 사용자가 수정 → `self_introduction`(최대 1500자)로 함께 저장

[모의면접 시작 — ADR-023]
지원 직무(필수) + 회사 채용공고(선택, 3000자) 입력, 분야 선택 없음
"자기소개로 시작하기"를 켜면 저장된 자기소개(수정 가능)를 첫 사용자 메시지로 보내 면접관이 꼬리 질문 (시작 화면에서 넘어온 한 번만 호출, 재진입 시 자동 호출 없음)

[모의면접 — 비회원]
메시지 전송 → 앱이 `package:http`로 interview-chat Function URL에 직접 POST
  (publishable key + X-Device-Id 헤더, 본문에 이력서 텍스트·직무·채용공고(선택)·이전 대화 포함. `categoryName`은 예전 앱 호환용 선택값)
  → Edge Function에서 기기 ID·IP 해시로 increment_guest_usage (초과 시 429)
  → 이전 대화 길이 제한 확인 → 프롬프트 구성 → LlmProvider.streamChat → SSE 스트리밍 응답
  → 앱이 응답을 청크 단위로 읽어 파싱 후 대화를 기기에 저장 (서버에는 사용량만 남음)

[모의면접 — 회원, M4 이후]
메시지 전송 (JWT) → user_id 확인 → increment_daily_usage (초과 시 429)
  → DB의 이력서·대화 이력으로 프롬프트 구성 → 스트리밍 응답 → interview_messages 저장

[회원가입 — M4]
OAuth 로그인 → 기기의 오답노트·이력서를 DB로 업로드 (자동, 확인 화면 없음)
  → 정책: 오답노트는 `unique(user_id, question_id)` 기준 중복 무시 병합, 이력서는 서버 우선(기존이면 업로드 안 함), 성공한 항목만 로컬 삭제
  → 한도: guest → free

[콘텐츠 관리 — M5-a]
어드민 로그인(비밀번호 전용 화면 → 고정 계정으로 signInWithPassword) → is_admin 확인
직접 작성: 문제 에디터에 입력 → questions insert(embedding 없음, M5-b 백필 대상) → is_published 토글로 게시/비게시
후보 승인: question_candidates(pending) 목록 → 같은 문제 에디터로 다듬기 → approve_question_candidate RPC(승인) 또는 status=rejected(반려)

[콘텐츠 수집 자동화 — M5-b, API 키 확보 후]
어드민 버튼 or 커맨드 → 자료 입력 → LLM 문제 초안 → 임베딩 → pgvector 유사도 비교
  → question_candidates(pending) → 어드민 승인(M5-a 화면 재사용) → questions(is_published)
```

## 네이밍 규칙

- **파일/디렉토리 (Dart)**: snake_case (`local_practice_store.dart`)
- **클래스/위젯**: PascalCase (`PracticePage`)
- **함수/변수**: camelCase (`fetchQuestions`)
- **Riverpod provider**: camelCase + `Provider` 접미사 (`authStateProvider`)
- **DB 테이블/컬럼**: snake_case, 테이블은 복수형 (`interview_sessions`)
- **Edge Function 디렉토리**: kebab-case (`interview-chat`)
