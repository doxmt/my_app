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
결정: 상태관리는 `flutter_riverpod`, 라우팅은 `go_router`를 쓴다.
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
