# 기술 결정 기록 (Architecture Decision Records)

---

## ADR-001: 백엔드로 Supabase 사용

**날짜:** 2026-09-17
결정: Postgres, Auth, Edge Functions를 Supabase 하나로 쓴다.
이유: Google/Apple/GitHub/Kakao OAuth를 기본 지원한다. RLS로 사용자별 데이터를 DB에서 격리할 수 있고, `supabase_flutter`가 세 플랫폼을 모두 지원한다.
대안: Firebase(NoSQL이라 오답노트·문제 같은 관계형 데이터가 불편함), 직접 구축(인증·레이트리밋을 전부 새로 만들어야 함).
트레이드오프: Edge Function이 Deno라 Node 생태계 라이브러리(특히 PDF 파싱)를 못 쓴다.

---

## ADR-002: 상태관리 Riverpod, 라우팅 go_router

**날짜:** 2026-09-17
결정: 상태관리는 `flutter_riverpod`, 라우팅은 `go_router`를 쓴다. 웹에서는 `usePathUrlStrategy()`로 path URL(`/categories` 등)을 지원하고, `vercel.json`에 SPA rewrite(`/(.*)` → `/index.html`)를 설정한다.
이유: 비동기 Supabase 호출과 스트리밍 채팅을 `AsyncNotifier`/`StreamProvider`로 다루기 쉽고, 테스트에서 provider override가 간단하다. 웹에서는 실제 URL과 인증 가드(redirect)가 필요하다.
대안: Bloc(이벤트/상태 클래스 보일러플레이트가 1인 개발에 과함), Provider(비동기·DI 도구가 약함).
트레이드오프: Riverpod 개념(ref, provider 종류)을 익혀야 한다.

---

## ADR-003: 비회원은 로그인 없이 사용, 데이터는 기기에만, 한도는 기기 ID + IP

**날짜:** 2026-09-17
결정: 비회원은 Supabase Auth(익명 로그인 포함)를 쓰지 않는다. 학습 기록·이력서·면접 대화는 기기에만 저장하고, 면접 요청마다 이력서와 이전 대화를 Edge Function에 보낸다. 사용량은 기기 ID(`X-Device-Id`)와 IP 해시 두 기준으로 `guest_daily_usage`에 센다. 회원가입 시 기기 데이터를 DB로 업로드한다.
이유: 사용자 요청 — 비회원이 로그인 절차 없이 바로 써야 한다. 서버에 비회원 데이터를 두지 않으면 신뢰할 수 없는 기기 ID로 데이터를 조회하는 경로 자체가 없어진다. 기기 ID만 쓰면 앱 데이터 삭제나 시크릿 창으로 한도가 초기화되므로 IP 한도를 함께 건다.
대안: Supabase 익명 로그인 + `linkIdentity`(처음 채택했으나 사용자 요청으로 변경), 기기 ID만, IP만, 비회원 데이터를 서버에 기기 ID로 저장.
트레이드오프: 기기를 바꾸면 비회원 기록이 따라가지 않는다. VPN·IP 변경 + 앱 초기화를 같이 하면 한도를 우회할 수 있다. 같은 IP를 쓰는 사람끼리 IP 한도를 나눠 써서 IP 한도를 넉넉히 잡아야 한다. 비회원이 요청 본문의 대화 이력을 조작할 수 있으므로 서버에서 이력 길이를 제한한다. 가입 시 데이터 업로드 코드가 필요하다.

---

## ADR-004: LLM은 Anthropic/OpenAI 어댑터로 교체 가능하게

**날짜:** 2026-09-17
결정: Edge Function 안에 `LlmProvider` 인터페이스와 Anthropic·OpenAI 어댑터를 두고 `LLM_PROVIDER` env var로 고른다. 세션마다 `provider`/`model`을 기록한다.
이유: 모델 교체와 비교를 앱 코드 수정 없이 하기 위해서다. API 키는 서버에만 둔다.
대안: 한 벤더 고정(간단하지만 교체 시 호출 코드 전체 수정).
트레이드오프: 두 API의 스트리밍 형식 차이를 어댑터에서 맞춰야 한다.

---

## ADR-005: PDF 텍스트 추출은 별도 Vercel Node 함수에서

**날짜:** 2026-09-17
결정: 텍스트 붙여넣기를 기본 입력으로 두고, PDF는 앱이 Vercel Node 서버리스 함수로 직접 보내 추출된 텍스트를 돌려받는다. 원본 PDF는 저장하지 않는다.
이유: Flutter의 PDF 파싱은 웹 지원이 불안정하고, Deno(Edge Function)에는 쓸 만한 PDF 파서가 없다. Vercel은 이미 쓰는 인프라다. 비회원은 로그인이 없어 Storage에 올릴 수 없으므로 업로드 없이 바로 추출하는 쪽이 회원·비회원 모두 단순하다.
대안: Storage 업로드 후 비동기 추출, 클라이언트 추출(플랫폼별 품질 차이), 외부 유료 파싱 API.
트레이드오프: 배포 대상이 하나 늘어난다(Supabase + Vercel 함수). 인증 없이 호출되는 함수라 파일 크기 제한과 호출 제한이 필요하다.

---

## ADR-006: 사용량 제한은 DB 테이블 + 원자적 RPC

**날짜:** 2026-09-17
결정: 회원은 `daily_usage`, 비회원은 `guest_daily_usage`에 UTC 날짜별로 카운트하고, 각각 `increment_daily_usage` / `increment_guest_usage` SECURITY DEFINER 함수로만 증가시킨다. 한도 숫자는 `rate_limit_config` 테이블(`guest_device`, `guest_ip`, `free`, `paid`)에서 읽는다.
이유: 조건부 update 한 문장이라 동시 요청에도 한도를 넘지 않는다. 한도 조정에 재배포가 필요 없다. 클라이언트는 카운터를 직접 수정할 수 없다.
대안: Edge Function 코드에 한도 하드코딩, Redis 같은 외부 저장소.
트레이드오프: 요청마다 DB 왕복이 1회 늘어난다.

---

## ADR-007: 개발 순서 — 핵심 기능 먼저, 회원가입·어드민은 마지막

**날짜:** 2026-09-17
결정: 문제풀이 → 모의면접을 먼저 만들고, OAuth 회원가입(M4)과 어드민 페이지(M5)는 뒤로 미룬다. 그 전까지 문제 데이터는 SQL 시드로 넣는다.
이유: 사용자 요청. 핵심 학습/면접 경험을 먼저 검증한다.
대안: 인증부터 구축.
트레이드오프: M4 전까지는 모든 사용자가 비회원이라 회원 한도와 DB 저장 경로를 테스트할 수 없다.

---

## ADR-008: 어드민은 별도 React 웹앱, 콘텐츠는 수집→AI 초안→중복 비교→승인 파이프라인

**날짜:** 2026-09-17
결정: 어드민 페이지는 Flutter가 아닌 React로 따로 만들고 같은 Supabase 프로젝트를 쓴다(`profiles.is_admin`으로 권한 확인). 문제는 자료 수집 → LLM 초안 → pgvector 임베딩 유사도로 중복 비교 → `question_candidates` → 관리자 승인 → `questions` 순서로 들어간다. 어드민 버튼이나 커맨드로 실행한다.
이유: 내부 도구라 Flutter일 필요가 없다. 문제를 매번 손으로 쓰는 대신 반자동화한다. 문구가 달라도 같은 개념인 문제를 잡으려면 문자열 비교보다 임베딩이 낫다.
대안: Flutter 앱 안에 어드민 화면, 수동 입력 CMS, pg_trgm 문자열 유사도.
트레이드오프: 임베딩은 한 제공자(OpenAI)로 고정해야 비교가 일관된다. 배포 대상이 하나 더 늘어난다.

---

## ADR-009: Supabase 접근 정보는 환경 설정으로, publishable key 사용

**날짜:** 2026-09-17
결정: Supabase URL과 publishable key는 `String.fromEnvironment`로 런타임에 읽는다. 로컬 개발은 `--dart-define-from-file=env/dev.json` (gitignore, `env/dev.json.example` 커밋), Vercel 웹 배포는 환경변수를 `--dart-define`으로 전달한다. CI(`flutter test`)는 provider override로 Supabase 없이 돌기 때문에 값이 필요 없다. 값이 없으면 앱 시작 시 명확한 에러를 보인다. `supabase_flutter`의 `Supabase.initialize()`는 deprecated `anonKey` 대신 `publishableKey` 파라미터를 사용한다.
이유: 민감한 키를 코드에 하드코딩하지 않는다. Supabase publishable key는 공개 안전(CORS 필터링됨)이지만 여전히 환경 변수로 주입하는 것이 관례다. 플랫폼별로 다른 Supabase 프로젝트를 교체하기 쉽다.
대안: 코드에 키 하드코딩, 런타임 서버에서 설정 다운로드.
트레이드오프: 개발 환경 설정 파일을 관리해야 한다. Vercel에 환경 변수를 미리 등록해야 한다.

---

## ADR-010: 하단 탭 3개, 모바일 화면 우선

**날짜:** 2026-09-17
결정: 하단 탭은 홈(`/`) · 모의면접(`/interview`) · 내 정보(`/me`) 3개다. 홈에서 분야를 고르고, 분야 화면에서 학습 방식을 고른 뒤 주제로 들어간다. 오답노트(`/me/wrong-notes`)·학습 기록·이력서 관리는 내 정보 안에 둔다. 화면은 모바일 레이아웃을 먼저 만들고, 웹 전용 레이아웃(넓은 화면)은 M6에서 한다. **(후속: ADR-019에서 웹 클라이언트를 Next.js로 분리하면서 웹 전용 레이아웃은 새 M6에 흡수, 기존 M6 폴리시/QA는 M7로 이동)** 웹 빌드·배포·path URL은 M1부터 유지한다.
이유: 모의면접은 핵심 기능이라 탭으로 바로 가게 한다. 오답노트는 자주 쓰지만 학습 흐름의 부속이라 내 정보에 모은다. 모바일과 웹은 UI 차이가 커서 한 번에 맞추면 작업이 늘어난다.
대안: 하단 탭 4개(홈/카테고리/오답노트/면접), 탭 없는 홈 허브, 처음부터 반응형 레이아웃.
트레이드오프: M6 전까지 웹은 모바일 레이아웃이 넓은 화면에 그대로 보인다. 오답노트까지 한 단계 더 들어가야 한다.

---

## ADR-011: PR 결과 한글 요약 댓글, GitHub 기본 브랜치 develop

**날짜:** 2026-09-17
결정: PR마다 CI(analyze/test)와 Vercel 배포 결과를 GitHub Actions가 한글 표 형식 댓글 하나로 달고 갱신한다. Vercel의 PR/커밋 봇 댓글은 끈다. GitHub 기본 브랜치를 `develop`으로 바꿔 develop 머지에서도 `Closes #N`으로 이슈가 자동으로 닫히게 한다. Vercel Production 브랜치는 `main`으로 따로 지정한다.
이유: Vercel 댓글은 언어·형식을 바꿀 수 없고 CI 결과는 담지 않는다. GitHub는 기본 브랜치 머지에서만 이슈를 자동으로 닫는데, 작업 PR은 모두 develop으로 머지한다.
대안: 이슈 닫기를 워크플로(yml)나 `/finish` 커맨드로 처리, CI 결과만 댓글로 남기고 배포 링크는 Vercel 댓글에 맡기기.
트레이드오프: 레포 첫 화면과 PR 기본 대상이 develop이 된다. CI와 배포 이벤트가 거의 동시에 오면 댓글 한쪽 결과가 잠깐 빠질 수 있다(다음 이벤트에서 채워짐).

---

## ADR-012: 비회원 로컬 저장은 `shared_preferences` + JSON, 답변 시도 기록 미저장

**날짜:** 2026-09-18
결정: 비회원의 오답노트는 `shared_preferences`에 JSON 형식으로 저장한다. 답변 시도 기록(연습 이력)은 저장하지 않는다. M4에서 회원 전환 시 서버로 올릴 데이터는 오답노트뿐이다.
이유: `shared_preferences`는 이미 기기 ID 저장에 쓰이고 있어 새로운 의존성이 없다. Android/iOS/Web 모두 동작한다. 답변 시도 기록까지 저장하면 M2 범위가 커진다.
대안: sqflite/drift(로컬 DB, 웹 설정 부담 증가), 답변 기록까지 저장(M2 범위 확대).
트레이드오프: M4에서 회원 전환 시 서버로 올릴 `practice_attempts` 데이터가 없다(오답노트만 이전됨). 학습 통계/기록 기능이 필요해지면 그때부터 쌓아야 한다. `shared_preferences`는 데이터가 커지면 느려질 수 있다(M2의 12문제 + 오답노트 수준에서는 무시할 수 있음). JSON 스키마 버전 관리가 필요하다(M4 업로드 시 옛 형식 호환성).

---

## ADR-013: M3 — PDF 함수 배치, 모의면접 스트리밍 호출 방식, LLM 어댑터 검증 범위

**날짜:** 2026-09-18
결정: (1) PDF 파싱 함수를 별도 Vercel 프로젝트가 아니라 이 레포 루트 `api/parse-pdf.ts`에 두고 기존 Flutter 웹 배포 프로젝트와 함께 빌드·배포한다. 라이브러리는 `unpdf`를 쓴다. (2) Flutter 클라이언트가 `interview-chat` Edge Function을 호출할 때 `supabase_flutter`의 `functions.invoke()`가 아니라 `package:http`로 Function URL에 직접 POST해 응답을 청크 단위로 읽어 SSE를 수동 파싱한다. 인증 헤더(`apikey`, `Authorization`, `X-Device-Id`)도 수동 구성한다. (3) M3 완료 시점에는 실제 LLM API 키가 없어 실호출 검증을 못 한다. 대신 Anthropic/OpenAI 어댑터는 `LlmProvider` 인터페이스로 코드를 완성하고, 벤더별 요청 형식·스트리밍 이벤트 파싱은 고정 SSE 샘플을 입력으로 쓰는 Deno 단위 테스트로 검증한다. 실제 벤더 API 호출을 통한 종단 스트리밍 검증(iOS에서 실제 LLM 응답으로 면접 대화)은 API 키 확보 후 별도 후속 작업으로 미룬다.
이유: 별도 Vercel 프로젝트를 만들면 도메인·CI·배포 파이프라인을 따로 관리해야 하는 부담이 크다. `unpdf`는 canvas 의존성이 없어 서버리스 환경에서 안정적이다. `functions.invoke`는 라이브러리 설계상 스트리밍 응답을 지원하지 않는다(Promise 기반 단건 응답만 처리). mock 어댑터를 제품 코드에 추가하면 검증용 분기가 제품에 남고, 실제 벤더 동작과의 괴리 위험이 있다.
대안: PDF 함수를 별도 Vercel 프로젝트로 분리, `functions.invoke` 폴링으로 스트리밍 우회, Anthropic/OpenAI 어댑터와 함께 mock 어댑터를 `LlmProvider` 구현으로 추가.
트레이드오프: 레포 루트에 Node `package.json`이 생겨 Flutter 전용이던 루트가 다중 런타임이 된다(첫 배포에서 Flutter web 빌드 회귀 확인 필요). Flutter 클라이언트가 인증 헤더를 수동으로 구성해야 한다(`functions.invoke`가 주던 편의 상실). M3 완료 시점에는 실제 LLM 응답 기반의 스트리밍 종단 검증이 빠진다(API 키 확보 전까지 실사용성 미확인).

---

## ADR-014: M4 — OAuth 제공자 범위, 데이터 이전 대상, 플랫폼별 로그인 방식

**날짜:** 2026-09-18
결정: (1) M4에서 Supabase Auth의 OAuth 제공자는 **Google + GitHub만** 지원한다. Apple은 Apple Developer Program 유료 가입($99/년)이 필요해 제외하고, Kakao는 Supabase 기본 지원이 확인됐으나(Kakao Developers 콘솔 등록 + Consent Items 설정 필요) 범위 조정 차원에서 M4 이후 후속 작업으로 미룬다. **(후속: ADR-018에서 해소)** (2) 회원가입 시 로컬에서 DB로 이전하는 데이터는 **오답노트 + 이력서만**이다. 면접 대화(`interview_sessions`, `interview_messages`)는 이전하지 않는다. 이전 정책: 오답노트는 `unique(user_id, question_id)` 기준으로 서버와 로컬의 중복을 무시하고 병합, 이력서는 서버에 이미 있으면 로컬을 올리지 않음(서버 우선), 성공한 항목만 로컬에서 삭제하고 실패 시 로컬을 보존해 재시도 가능하게 한다. (3) Google 로그인은 플랫폼별로 구분한다 — Android/iOS는 네이티브 `google_sign_in` 7.x(싱글턴 `GoogleSignIn.instance` + `initialize()`)로 ID 토큰을 얻어 `signInWithIdToken()`을 호출하고, Web은 `signInWithOAuth()` 리다이렉트를 쓴다. GitHub는 네이티브 SDK가 없어 전 플랫폼에서 `signInWithOAuth()` 리다이렉트로 통일한다.
이유: (1) Apple의 개발자 계정 비용은 선행 부담이고 Kakao는 이미 Supabase 지원이 확인되어 M4 범위를 먼저 Google/GitHub로 한정해 빠르게 검증한다. (2) 면접 대화는 비회원 때 사용한 임시 정보로 재현 가치가 낮고, 이전 작업(두 테이블 쓰기 + 메시지 순서·역할 매핑 검증)이 크다. 대신 이력서와 오답노트는 학습 기록의 핵심이라 반드시 이전한다. (3) Google 네이티브 SDK는 지원하는 플랫폼에서 UX가 낫고(싱글 탭 로그인, 계정 선택 UI 등), GitHub는 애초에 네이티브 SDK가 없어 웹뷰 리다이렉트만 가능하다. 네이티브/웹 섞기보다 각 제공자별로 최적 방식을 고른다.
대안: (1) Apple을 M4에 포함하기(비용 선처리), Kakao를 포함하기. (2) 면접 대화까지 이전하기. (3) Google을 전 플랫폼에서 리다이렉트로 통일하기(구현 단순, UX 하락).
트레이드오프: (1) Apple/Kakao 없이 출시하면 출시 후 사용자 요청에 따라 급하게 추가해야 할 수 있다(특히 Apple은 iOS 앱스토어에서 소셜 로그인을 제공하면 Apple 로그인도 지원해야 한다는 정책이 있을 수 있음). (2) 면접 대화를 이전하지 않으면 비회원 때 쌓은 대화가 계정 전환 후 사라진다. (3) Google을 리다이렉트로 통일하면 모바일에서 여러 창이 오가며 UX가 저하된다.

---

## ADR-015: M4 구현 — `profiles` 생성 방식, 데이터 이전 위치, 리포지토리 분기 기준

**날짜:** 2026-09-18
결정: (1) `profiles` 행 자동 생성은 **DB 트리거**(`auth.users` `after insert` + `security definer` 함수)로 한다. 함수 본문은 `insert ... on conflict (id) do nothing`만 수행해 예외를 던질 수 없게 최소화하고, 표시 이름/아바타는 `raw_user_meta_data`에서 `coalesce`로만 읽는다(Google/GitHub 키가 다름). 같은 마이그레이션에 기존 가입자 백필도 포함한다. (2) 로컬→DB 데이터 이전(오답노트·이력서)은 **Flutter 앱이 Supabase를 직접 호출**해 처리한다(Edge Function을 추가로 만들지 않음). (3) 회원/비회원 리포지토리 분기는 `Session` 객체가 아니라 **`userId`만 노출하는 provider**(`currentUserIdProvider`)로 하고, 로그인 성공 후 데이터 이전이 끝날 때까지 이 provider가 null을 유지하게 한다. (4) 회원(`free`) 일일 면접 한도는 12회, 비회원 `guest_device` 한도는 기존 10에서 3으로 조정한다(`guest_ip` 40은 유지).
이유: (1) 이 스키마에서 `profiles`를 참조하는 FK가 없어(회원 테이블은 전부 `auth.users`를 직접 참조) 트리거 없이도 race condition은 발생하지 않지만, 대시보드에서 만든 테스트 계정이나 M5 어드민 계정처럼 앱 코드를 거치지 않는 가입까지 커버하려면 트리거가 유일한 방법이다. 이 프로젝트는 원격에 `supabase db push`만 하고 로컬 `db reset`을 반복하지 않으므로 "auth 스키마 트리거는 마이그레이션 관리가 까다롭다"는 일반론의 비용을 거의 지불하지 않는다. (2) `wrong_notes_owner_all`/`resumes_owner_all` RLS와 GRANT가 이미 이 용도로 맞춰져 있어 새 마이그레이션이 필요 없고, Edge Function으로 빼면 `service_role`이 RLS를 우회하므로 함수가 직접 JWT를 검증해야 해 보안 표면만 늘어난다. (3) `Session`은 토큰 갱신(약 1시간 주기)마다 새 객체로 교체되어 그대로 watch하면 리포지토리 provider가 불필요하게 rebuild된다. 이전 완료 전까지 회원 리포지토리로 전환되면 오답노트가 잠깐 사라진 것처럼 보인다. (4) 회원 가입 유인을 위해 비회원보다 넉넉한 한도가 필요했다.
대안: (1) 앱에서 로그인 성공 후 upsert. (2) Edge Function으로 이전 처리. (3) `Session` 전체를 watch. (4) 임시값 유지 후 출시 전 확정.
트레이드오프: (1) 트리거 함수가 예외를 던지면 GoTrue가 **모든 가입**을 500으로 떨구므로 본문을 극도로 단순하게 유지해야 하고, 런타임 코드는 `profiles` 행이 없을 가능성(트리거 배포 이전 유예 구간 등)을 전제하고 `plan_tier` 폴백을 둬야 한다. (2) 클라이언트가 이전 로직(중복 병합, FK 존재 필터링, 서버 우선 판단)을 직접 구현해야 해 서버 집중 방식보다 코드가 분산된다. (3) 별도 provider·가입 상태(migrating) 관리가 필요해 상태 그래프가 하나 늘어난다. (4) 숫자는 임시값이라 실사용 데이터로 출시 전 재조정이 필요하다.

---

## ADR-016: M5-a 어드민 로그인 — 고정 계정 + 비밀번호 전용 화면

**날짜:** 2026-09-20
결정: 어드민 로그인은 Supabase에 고정으로 생성한 관리자 계정 1개를 쓴다. 화면에는 비밀번호 입력칸만 노출하고, 내부적으로 env var의 고정 이메일과 함께 `signInWithPassword(이메일, 입력한_비밀번호)`를 호출한다. 로그인 성공 후 `profiles`에서 자기 `is_admin` 값을 읽어 false면 진입을 거부하고 로그아웃시킨다.
이유: RLS가 Supabase Auth의 JWT를 보고 권한을 판정하는 구조이므로, "Supabase Auth 없는 순수 비밀번호 게이트"는 DB가 그 사실을 알 수 없어 구조적으로 불가능하다. 고정 계정 방식은 UX(비밀번호 한 칸)와 보안(`is_admin` RLS)을 모두 만족시킨다. 대안인 OAuth(Google/GitHub)는 Supabase 콘솔에 앱 등록 선행 비용이 크다. 이 방식은 콘솔 등록 없이 지금 바로 시작할 수 있다.
대안: 비밀번호 게이트만으로 (DB 권한 문제 있음), OAuth 로그인(M4와 동일, 콘솔 등록 필요), API 키 기반 인증(클라이언트가 키를 간직하면 노출 위험).
트레이드오프: 어드민 계정이 고정이라 여러 관리자가 쓸 수 없다. 비밀번호 변경은 Supabase 대시보드에서 수동으로만 가능하다.

---

## ADR-017: M5를 M5-a(수동 콘텐츠) / M5-b(LLM 파이프라인)로 분할

**날짜:** 2026-09-20
결정: 원래 M5("어드민 + 콘텐츠 자동화")를 두 단계로 나눈다. **M5-a(이번 작업)**는 Vite+React 어드민 웹앱과 관리자가 직접 문제를 작성·게시하는 기능, 그리고 M5-b가 붙을 때 동작할 후보 승인 UI까지 포함한다. **M5-b(후속)**는 `content-pipeline` Edge Function(LLM 초안 + OpenAI 임베딩 중복 비교)인데, LLM/임베딩 API 키가 아직 없어 별도 마일스톤으로 미룬다.
이유: 현재 문제 콘텐츠는 CS·프론트엔드 2개 분야 12문제뿐이고, 추가 수단이 SQL 시드밖에 없다. M5-a의 "관리자 수동 입력" 기능으로 이 병목을 즉시 해소할 수 있다. 어드민 웹앱과 승인 UI는 API 키 없이도 완전히 구현 가능하고, LLM·임베딩 호출은 이후 키 확보 후 별도 작업으로 진행할 수 있다.
대안: M5 전체를 한 번에 (LLM 없이 임시로라도 콘텐츠를 하드코딩해가며 구현), M5를 M5-a(앱) / M5-b(어드민 + 파이프라인)로 분할(어드민 없이 시작하는 이상하기).
트레이드오프: 어드민 웹앱이 먼저 배포되므로 초기에는 후보 승인 UI가 비어 있다(M5-b 시작 전까지). M5-a 완료 후 LLM 키를 얻을 때까지의 시간이 불확실하다(키 확보까지는 M5-b를 시작할 수 없다).

---

## ADR-018: Apple/Kakao OAuth 추가와 홈 카드 아이콘 방식

**날짜:** 2026-09-21
결정: (1) **Apple 로그인**: iOS는 네이티브 `sign_in_with_apple` SDK로 ID 토큰 + nonce를 얻어 `signInWithIdToken()`을 호출한다. Web과 Android는 Supabase의 `signInWithOAuth(OAuthProvider.apple)` 리다이렉트를 쓴다. 이를 위해 Apple Developer Program 계정(기존)의 Services ID와 .p8 키 파일이 필요하며, client secret JWT는 개발팀이 6개월 주기로 갱신한다. (2) **Kakao 로그인**: 네이티브 SDK 미사용, 전 플랫폼(iOS/Android/Web)에서 `signInWithOAuth(OAuthProvider.kakao)` 리다이렉트로 통일한다. Kakao는 이메일 동의항목이 Biz App 전용이라 **현재는 이메일 없이 가입을 허용**한다(Supabase 설정: "Allow users without an email"). 최종 확정은 계획 단계의 Open Question이므로 향후 검토 시 다시 결정한다. (3) **딥링크**: iOS는 `CFBundleURLTypes`에 커스텀 스킴을 등록하고, Android는 intent-filter에 등록한다. 스킴 값(reverse-domain 형식)은 계획 단계에서 확정 예정이므로 이 문서에서는 "확정 전"으로 표기한다. (4) **홈 분야 카드 UI**: 각 분야 카드의 아이콘은 DB에 컬럼을 추가하지 않고 Flutter 앱 코드에서 `category.slug` → `IconData` 매핑으로만 처리한다. 분야가 추가될 때마다 앱의 매핑 코드를 업데이트하고 배포해야 한다.
이유: (1) App Store 정책 4.8에 따라 다른 소셜 로그인을 제공하면 Apple 로그인도 지원해야 한다. iOS 사용자 경험을 위해 네이티브 SDK를 쓰되, Web/Android는 이미 Supabase가 지원하는 OAuth 리다이렉트로 통일한다. (2) Kakao는 Supabase에서 기본 지원되어 있고, 이메일 미필수 가입은 "Supabase Allow users without an email" 설정으로 간단히 해결된다. 최종 이메일 요건은 사용자 피드백 수집 후 M5-a 이후 마일스톤에서 재검토한다. (3) 딥링크는 표준화된 기능으로, 앱 호출 흐름에서는 필요하지만 현재 프로토타입 단계에서는 구체 값을 확정할 필요가 없다. (4) DB에 아이콘 컬럼을 추가하면 마이그레이션이 필요하고 각 분야에 값을 입력해야 하는데, 아이콘 선택은 디자인 결정이라 여러 번 바뀔 가능성이 높다. 앱 코드 매핑은 유연하고 변경 시 앱 배포만으로 즉시 반영된다.
대안: (1) Apple을 M4에 포함하면서 비용 선처리, Kakao 미지원, Kakao를 이메일 필수로 운영하기. (2) 딥링크 스킴을 미리 확정하고 등록하기. (3) 아이콘을 DB 컬럼(`icon_slug`)으로 저장하고 프론트에서 이를 조회해 매핑하기. (4) 아이콘 SVG를 모두 앱에 번들로 포함하기.
트레이드오프: (1) iOS와 Web/Android가 다른 로그인 흐름을 쓰므로 로그인 코드에서 플랫폼 분기가 필요하다. Apple의 client secret JWT는 6개월마다 갱신해야 하는 운영 비용이 생긴다. (2) 이메일 없는 계정은 향후 이메일 기반 기능(복구, 알림 등)을 추가할 때 추가 처리가 필요할 수 있다. (3) 딥링크 스킴을 미리 확정하지 않으면 향후 마케팅/분석 추적에서 지연이 생긴다. (4) 아이콘 매핑을 앱 코드에 두면 새 분야 추가 시마다 앱을 배포해야 한다(분야를 어드민이 자유롭게 추가할 수 없음).
후속: ADR-014의 "M4 이후 후속"이었던 Apple/Kakao 지원을 이 결정으로 해소한다. 딥링크 스킴 값은 이번 작업(Apple/Kakao 로그인) 계획 단계에서 확정하고, 그때 iOS/Android 매니페스트를 업데이트한다. Kakao 이메일 요건도 출시 후 사용자 데이터로 재평가한다.

---

## ADR-019: 웹 클라이언트를 Flutter에서 Next.js로 분리

**날짜:** 2026-09-29
결정: 웹 클라이언트를 Flutter 웹 빌드가 아니라 같은 레포 `webapp/`의 **Next.js 16(App Router, TypeScript, Tailwind v4, shadcn/ui)** 앱으로 다시 만든다. Android/iOS는 계속 Flutter다. 범위는 전 기능 동등(문제풀이·오답노트·이력서 텍스트/PDF·모의면접 SSE·OAuth 4종·로컬→DB 이전)이고, 동등 기능이 완성된 뒤 한 번에 전환(컷오버)한다. 렌더링은 클라이언트 컴포넌트 중심이며 SEO(공개 페이지 SSG/ISR)는 목표가 아니다. 비회원 저장은 Flutter와 같은 키·`{ version: 1, items }` 형식의 localStorage, 회원 여부 분기는 `userId` 하나로 한다. 모의면접은 브라우저가 `interview-chat` Function URL을 직접 호출하고(Next 서버 경유 금지), PDF 추출만 `webapp/app/api/parse-pdf` Route Handler(Node)가 맡는다. Vercel은 새 프로젝트를 만들지 않고 **기존 루트 프로젝트의 Root Directory를 `webapp/`으로 바꾸며**(구버전 모바일 앱 없음), 컷오버는 develop → main 릴리즈 push다. 어드민(`admin/`)은 그대로 별도 유지한다. 이슈 #23(Flutter 반응형 레이아웃)은 폐기한다.
이유: 사용자가 웹은 React/Next 생태계로 따로 만들기로 결정했다. Flutter 안에서 반응형 레이아웃을 만드는 대신 웹에 맞는 도구로 웹을 만든다. 면접 요청을 Next 서버로 우회시키면 모든 요청이 Vercel IP로 잡혀 `guest_ip` 한도가 무너지고 API 표면만 늘어나므로 브라우저 직접 호출을 유지한다. Root Directory 변경(A안)은 새 프로젝트 도메인·설정을 따로 관리하지 않아도 되고, 구버전 모바일 앱이 없어 루트 `api/parse-pdf.ts`가 사라져도 같은 도메인·같은 경로의 Route Handler가 이어받으면 된다.
대안: Flutter 웹 반응형(#23), 새 Vercel 프로젝트로 병행 운영 후 컷오버(B안), Next에서 SSG/ISR로 공개 페이지 SEO 대응, 어드민과 웹 통합.
트레이드오프: 화면과 로직을 Flutter와 Next 두 벌로 구현해야 해 새 기능마다 두 번 작업한다. Root Directory 변경 순간부터 develop Preview는 Next만 빌드하고 Flutter 웹 Preview는 사라지며, 변경 후 `main` push는 곧 Next Production 배포다. Root Directory 변경 시 도메인·env·Production Branch 유지 여부는 공식 문서로 확인하지 못해 변경 전 화면 캡처로 대응한다. 웹 SSE 스트리밍(특히 iOS Safari)은 Flutter 웹에서도 실측된 적이 없어 Next에서 처음 확인한다. 루트의 Flutter 웹 빌드 경로(`vercel.json`, `scripts/vercel-build.sh`, `api/parse-pdf.ts`, `web/`)는 컷오버 안정화 후 별도 정리한다.

---

## ADR-020: 웹·앱 색상 통일과 화면 모드 정책

**날짜:** 2026-09-30
결정: 웹(`webapp/`)과 모바일 앱(`lib/app/theme.dart`)의 색상 토큰을 같은 값으로 맞춘다 — 흰 배경, 강조색 블루 `#2563eb`, 모서리 8dp. 화면 모드는 웹과 앱 모두 **기본이 라이트**이고, 기기(시스템) 설정은 따르지 않는다. 사용자가 라이트/다크를 골라 바꿀 수 있다 — 웹은 상단 헤더의 전환 버튼과 내 정보의 "화면 모드", 앱은 내 정보의 "화면 모드". 웹은 `localStorage`의 `theme`(`light`/`dark`)와 `<html>`의 `dark` 클래스로, 앱은 `SharedPreferences`의 `theme_mode`와 `ThemeMode`로 처리한다.
이유: 배경을 흰색으로 하고 싶다는 요구에서 출발했고, 사용자가 직접 라이트/다크를 고를 수 있길 원했다. 기기 설정을 따르면 OS가 다크인 환경에서 흰 배경이 기본으로 보이지 않아 기본을 라이트로 고정했다. (진행 중 웹 "항상 라이트" → "시스템 기본 + 선택" → "라이트 기본 + 선택"으로 바뀌었고, 앱도 "시스템 기본"에서 "라이트 기본"으로 바뀌었다.)
대안: 시드 색 기반 자동 팔레트 유지(녹색 `#1F5A4A`, 웹과 색이 달라짐), 기본을 기기 설정 따라가기(시스템 + 라이트/다크 고정), 시스템/라이트/다크 3버튼 방식.
트레이드오프: 화면 모드 설정은 기기별로 저장되어 웹과 앱 사이, 기기 사이에 공유되지 않는다. 기기 설정을 따르는 옵션이 없다. 색 토큰이 CSS와 Dart 두 곳에 있어 한쪽을 바꾸면 다른 쪽도 손으로 맞춰야 한다. 앱에는 웹의 IBM Plex Sans KR 폰트를 적용하지 않았다(의존성 추가 필요).
