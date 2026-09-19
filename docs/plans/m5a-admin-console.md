# M5-a. 어드민 웹앱 + 콘텐츠 관리

작성: 2026-09-20

## 컨텍스트

M0~M4 완료. PR #12(M4 OAuth)는 이미 머지됨(2026-09-18, CI·Vercel SUCCESS).

로드맵상 M5는 "어드민 페이지 + 콘텐츠 자동화"이나, **LLM/임베딩 API 키가 없어** 자동화 부분을 분리한다.

- **M5-a (이번 작업)**: 어드민 웹앱 + 사람이 직접 하는 콘텐츠 관리
- **M5-b (후속)**: `content-pipeline` Edge Function — LLM 초안 생성 + OpenAI 임베딩 중복 비교. **착수 조건 = API 키 확보**

현재 문제 콘텐츠는 CS·프론트엔드 2개 분야 12문제뿐이고 추가 수단이 SQL 시드밖에 없다(`CLAUDE.md` 규칙). M5-a는 이 병목을 푸는 것이 실질 목표다.

### 인터뷰 확정 사항

| 항목 | 결정 |
|---|---|
| 범위 분할 | M5-a(어드민+수동 콘텐츠) / M5-b(파이프라인, 키 확보 후) |
| 어드민 로그인 | 고정 관리자 계정 1개 + 화면엔 비밀번호 칸만. 내부적으로 `signInWithPassword(고정이메일, 입력비번)` |
| M4 의존성 | 0단계로 축소 — 대시보드 계정 생성 + `is_admin=true`. **OAuth 콘솔 등록 불필요** |
| 기능 범위 | 후보 승인 UI + 문제 직접 작성을 **같은 에디터 폼**으로 공유 |
| 카테고리 관리 | 포함 (분야/주제 추가·수정) |
| 프레임워크 | Vite + React + TypeScript, Tailwind v4 + shadcn/ui |
| 코드 위치 | 같은 레포 `admin/` + **Vercel 프로젝트만 별도** (Root Directory = `admin/`) |

로그인 방식 보충: RLS가 JWT를 보고 권한을 판정하므로 "Supabase Auth 없는 순수 비밀번호 게이트"는 구조적으로 불가능하다. 고정 계정 방식은 원하는 UX(비밀번호 한 칸)를 주면서 RLS·`is_admin`을 그대로 살린다.

### 사전 조사 결과 (2026-09-20)

**스키마 (explore)**
- `categories` — RLS는 `categories_public_select`(공개 select)뿐. **insert/update 정책 없음**.
- `questions` — `is_published boolean not null default false`, `embedding extensions.vector(1536)` **nullable**. RLS는 `questions_published_select`(`is_published = true`만)뿐. **insert/update 정책 없고, 미게시 조회 경로도 없음**.
- `question_candidates` — `question_candidates_admin_all` 정책과 GRANT가 **이미 존재**(is_admin에게 전 권한). status enum `pending/approved/rejected`, `duplicate_of`/`similarity_score`/`reviewed_at`/`reviewed_by` 보유.
- `profiles` — `profiles_owner_all`(`auth.uid() = id`). 본인 행 select 가능 → 로그인 직후 `is_admin` 조회 가능.
- Flutter 앱(`lib/features/practice/data/supabase_question_repository.dart`)은 `is_published` 필터 코드가 없고 **RLS에 의존**해 자동으로 걸러진다.

**배포/라이브러리 (document-specialist)**
- Vercel: 같은 레포를 Dashboard에서 다시 Import하고 Root Directory를 `admin/`으로 지정하면 별도 프로젝트가 된다. "변경 없는 프로젝트 자동 스킵"은 JS 워크스페이스 구성이 전제라 이 레포(Flutter+React 혼합)에선 기대할 수 없으므로 **양쪽에 Ignored Build Step을 수동 설정**한다.
- Supabase: `persistSession`/`autoRefreshToken`/`detectSessionInUrl` 기본값으로 충분. `signInWithPassword` 성공 시 localStorage 저장·새로고침 복원이 자동. 커스텀 storage 불필요.
- shadcn/ui: Tailwind v4 + `@tailwindcss/vite` 플러그인(PostCSS 불필요). 경로 별칭은 `tsconfig.json`과 `tsconfig.app.json` **둘 다** 설정해야 하고, `vite.config.ts`에도 alias가 필요하다.

## 작업 목표

관리자가 **SQL을 쓰지 않고** 브라우저에서 카테고리와 문제를 만들고 게시할 수 있게 한다. 동시에 M5-b가 붙는 즉시 후보 승인 흐름이 동작하도록 승인 UI를 같은 폼 위에 올려둔다.

## 가드레일

**반드시 지킬 것**
- 마이그레이션에는 `GRANT`와 RLS 정책을 **항상 함께** 쓴다 (`CLAUDE.md` — 새 테이블 Data API 자동 노출 없음 + RLS 자동 활성화).
- 어드민 권한 판정은 **RLS 정책 + `profiles.is_admin`** 으로만 한다. 프론트의 화면 숨김은 UX일 뿐 보안 장치가 아니다.
- 관리자 이메일은 env var로 주입한다. 비밀번호는 사용자가 매번 입력한다.
- 승인/게시는 단일 RPC로 처리해 후보 상태 변경과 `questions` 삽입이 갈라지지 않게 한다.

**절대 하지 말 것**
- `service_role` 키를 어드민 프론트엔드에 두지 않는다 (번들에 그대로 노출된다).
- 이번 작업에서 **LLM·임베딩 호출을 만들지 않는다**. `content-pipeline`은 M5-b다.
- **Flutter 앱 코드를 고치지 않는다.** 앱은 `questions`를 읽기만 하고 필터링은 RLS가 한다.
- 루트 `vercel.json` / `package.json`을 건드리지 않는다. 어드민은 별도 Vercel 프로젝트다.
- 같은 Vercel 프로젝트 안에 `/admin/` 경로로 통합하지 않는다 (루트 `buildCommand`·`outputDirectory`·SPA rewrite를 전부 바꿔야 해 기존 배포와 충돌).
- 문제를 물리 삭제하지 않는다 (`is_published` 토글로 내린다).

## 작업 흐름

### 0단계 — 선행 조건 (사용자 수동, 5분)

Supabase 대시보드에서 관리자 계정 1개 생성 → `profiles.is_admin = true` 지정.

**인수 기준**: `profiles`에 `is_admin=true` 행이 1개 존재하고, 해당 이메일/비밀번호를 알고 있다.

### 1단계 — 어드민 앱 셸 + 비밀번호 전용 로그인

`admin/`에 Vite + React + TS 초기화. Tailwind v4는 `@tailwindcss/vite` 플러그인으로 붙이고, 경로 별칭 `@/*` → `./src/*`를 `tsconfig.json`·`tsconfig.app.json`·`vite.config.ts` 세 곳에 설정한 뒤 `shadcn init`으로 `components.json`을 만든다.

Supabase 클라이언트는 기본 옵션으로 생성한다(세션 퍼시스턴스 커스터마이징 불필요). 로그인 화면은 비밀번호 입력칸 하나만 두고, 제출 시 env var의 고정 이메일과 함께 `signInWithPassword`를 호출한다. 로그인 후 `profiles`에서 자기 `is_admin`을 읽어 false면 진입을 막고 로그아웃시킨다.

Vercel Dashboard에서 같은 레포를 다시 Import해 Root Directory `admin/`으로 새 프로젝트를 만들고, 양쪽 프로젝트에 Ignored Build Step을 설정한다.
- Flutter 프로젝트: `git diff HEAD^ HEAD --quiet -- ./admin/` (admin만 바뀌면 스킵)
- admin 프로젝트: admin 외 경로만 바뀌면 스킵하는 반대 조건

**인수 기준**
- 배포된 어드민 URL에서 비밀번호만 입력해 로그인되고, **새로고침해도 세션이 유지**된다.
- `is_admin=false` 계정은 로그인 후 진입이 거부된다.
- `admin/`만 수정한 커밋에서 Flutter 프로젝트 빌드가 스킵되고, 앱 코드만 수정한 커밋에서 admin 빌드가 스킵된다.
- 기존 Flutter 웹 배포(Preview/Production)가 정상이다.

### 2단계 — 어드민 쓰기·조회 권한 마이그레이션

`profiles.is_admin = true`인 authenticated에게 권한을 연다.
- `categories` — insert / update (`categories_public_select`는 유지)
- `questions` — **select(미게시 포함 전체)** / insert / update
- 각각에 대응하는 `GRANT`
- `question_candidates` — 기존 `question_candidates_admin_all`로 충분, **변경 없음**
- 승인 RPC — 후보를 `questions`에 게시하고 후보 `status`를 approved로, 한 트랜잭션에서 처리

`questions`의 기존 select 정책이 `is_published = true`만 허용하므로, 어드민 select 정책이 없으면 방금 작성한 미게시 문제가 목록에 뜨지 않는다. 이것이 이 단계의 핵심이다.

**인수 기준**
- 어드민 계정으로 **미게시(`is_published=false`) 문제가 조회된다**.
- 어드민 계정으로 `categories`/`questions` insert·update가 된다.
- 비로그인(anon)과 일반 회원(`is_admin=false`)은 쓰기와 미게시 조회가 **모두 거부**된다.
- 승인 RPC 한 번으로 `questions` 행 생성과 후보 `status` 변경이 함께 일어난다.
- `supabase db push`가 원격에 성공한다.

### 3단계 — 카테고리 관리 화면

분야/주제 2단계 트리 목록, 생성·수정. `parent_id`로 주제를 분야에 붙인다.

**인수 기준**
- 어드민에서 새 분야와 그 하위 주제를 만들 수 있다.
- 만든 분야가 **Flutter 앱 홈 화면에 즉시 나타난다**.

### 4단계 — 공유 문제 에디터 (직접 작성 + 후보 승인)

문제 필드(`type`, `prompt`, `model_answer`, 카테고리, `difficulty`, `tags`)를 편집하는 폼 하나를 만들고 진입점 둘을 붙인다.

- **직접 작성**: 빈 폼 → `questions` 저장 → 게시 토글(`is_published`)
- **후보 승인**: `question_candidates(pending)` 목록 → 후보 내용이 채워진 같은 폼 → 다듬어 승인(RPC) 또는 반려

`embedding`이 nullable이므로 직접 작성 문제는 임베딩 없이 저장한다(M5-b 백필 대상).

**인수 기준**
- 새 문제를 작성·게시하면 **앱의 해당 주제 문제 목록에 나타난다**.
- 게시 토글을 내리면 앱에서 사라진다.
- 후보를 수정 후 승인하면 `questions`에 **수정된 내용**이 들어가고 후보 status가 approved가 된다.
- 반려한 후보는 목록에서 빠지고 `questions`에 아무것도 생기지 않는다.
- 미게시 문제가 어드민 목록에서는 보인다.

### 5단계 — 종단 검증

SQL로 더미 후보 몇 건 삽입 → 어드민에서 승인/반려 → Flutter 앱(웹 + iOS 시뮬레이터)에서 결과 확인.

**인수 기준**
- `CLAUDE.md` Definition of Done 통과 (`flutter analyze`, `flutter test` — 앱 코드 무변경이므로 회귀 확인 목적).
- 어드민 빌드/타입체크 통과.
- 앱에서 신규 분야 → 주제 → 문제 → 학습하기/문제풀기 여정이 끊기지 않는다.

## 성공 기준

1. SQL 없이 어드민에서 분야·주제·문제를 만들어 앱에 노출시킬 수 있다.
2. 후보 승인 흐름이 더미 후보로 실제 동작한다 (M5-b가 붙으면 그대로 살아난다).
3. 권한이 RLS로 막혀 있다 — 비로그인·비어드민은 쓰기와 미게시 조회가 거부된다.
4. 기존 Flutter 앱과 웹 배포에 회귀가 없다.

로드맵 M5 완료 기준 중 "중복 후보에 `duplicate_of`가 채워짐"은 **M5-b 몫**이다. M5-a는 "승인한 문제가 앱에 바로 보임"까지 담당한다.

## 후속 문서 갱신 (writer)

- `docs/prd.md` — 미결 "어드민 프레임워크" → Vite+React 확정, "자료 소스" → 관리자 수동 입력 확정
- `docs/overview.md` — 미결 목록 동일 갱신
- `docs/roadmap.md` — M5를 M5-a / M5-b로 분할하고 각 완료 기준 재작성
- `docs/adr.md` — 신규 ADR 2건
  - 어드민 로그인 = 고정 계정 + 비밀번호 전용 화면 (RLS가 JWT 기반이라 Auth 없는 순수 게이트는 불가)
  - M5를 a/b로 분할 (API 키 미확보, 직접 작성이 SQL 시드 병목을 즉시 해소)

`docs/current_state.md`와 `docs/work_log.md`는 `/wrap`에서만 작성한다.

## Open Questions

`docs/plans/open-questions.md`의 "M5-a 어드민 웹앱 - 2026-09-20" 항목 참고.
