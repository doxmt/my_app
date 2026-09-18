# M3. 이력서 입력 + 모의면접 (비회원)

작성일: 2026-09-18
대상: `docs/roadmap.md`의 M3
선행: M2 (PR #7) 머지 후 착수

## 컨텍스트

M2로 분야 → 학습/문제풀기 → 주제 → 문제 상세와 로컬 오답노트까지 끝났다. 현재 상태:

- `supabase/migrations/20260917082153_init_schema.sql`에 12개 테이블이 전부 있다. `resumes`, `interview_sessions`, `interview_messages`, `guest_daily_usage`, `rate_limit_config`도 이미 존재하고 **함수(RPC)는 하나도 없다.** → M3의 DB 작업은 `increment_guest_usage` 함수 추가 + `rate_limit_config` 행 삽입뿐이다. 새 테이블은 필요 없다.
- `resumes` / `interview_sessions` / `interview_messages`는 회원용이다. **M3(비회원)에서는 읽지도 쓰지도 않는다.**
- `supabase/functions/` 디렉토리가 없다 → `interview-chat`이 이 프로젝트의 첫 Edge Function이고, `supabase functions deploy` 경로를 처음 뚫는다.
- 루트에 `package.json`이 없고 `api/` 디렉토리도 없다. `vercel.json`은 Flutter 웹 전용 커스텀 빌드다(`installCommand: "true"`, buildCommand가 Flutter를 clone해 `flutter build web`, `outputDirectory: build/web`, SPA rewrite). `.github/scripts/pr-summary.js`는 `github-script@v9` 안에서 독립 실행되므로 루트 `package.json`과 무관하다.
- `lib/features/interview/presentation/interview_page.dart`는 "모의면접 기능은 준비 중입니다." 플레이스홀더다. `lib/features/resume/`는 디렉토리 자체가 없다.
- 로컬 저장 계층은 M2에서 만들어져 있다: `lib/core/storage/local_json_store.dart`(`LocalJsonStore` 추상화 + `SharedPreferencesAsync` 구현 + 단위테스트용 in-memory fake), `lib/features/wrong_notes/data/local_wrong_note_repository.dart`(키당 `{version, items}` 구조를 통째로 read-modify-write, `_schemaVersion` 상수). 이력서·면접 대화 저장에 그대로 재사용한다.
- 현재 의존성: `supabase_flutter ^2.17.2`, `flutter_riverpod ^3.4.3`, `go_router ^18.0.1`, `shared_preferences ^2.5.5`, `uuid ^4.6.0`. 파일 선택·HTTP 패키지는 없다.

### 인터뷰에서 확정된 사항

| 항목 | 결정 |
|---|---|
| PDF 범위 | **이번에 포함.** 텍스트 붙여넣기 + PDF 업로드 둘 다 |
| PDF 함수 배치 | **같은 레포 `api/parse-pdf.ts`, 같은 Vercel 프로젝트** (ADR-013) |
| LLM API 키 | **없음.** 어댑터 코드만 완성, 실호출 검증은 키 확보 후 별도 후속 |
| mock 어댑터 | **추가하지 않는다.** 검증용 분기를 제품 코드에 남기지 않음 (ADR-013) |
| 면접 시작 흐름 | **이력서 + 지원 분야/직무 선택 후** 채팅 시작 |
| 스트리밍 검증 | **iOS 시뮬레이터만.** Android는 AVD 없음, 웹은 완료 기준 제외 |
| 채팅 UI | Material 3 + M2 패턴으로 심플하게. 디자인 다듬기는 후순위 |
| 한도 숫자·길이 제한·모델 | **이번에 결정하지 않음.** 임시값으로 진행하고 Open Questions에 남김 |

### 사전 조사 결론

**Vercel**
- Function 요청 본문 한도는 **4.5MB**(초과 시 413). 스트리밍 응답에는 이 제한이 적용되지 않는다.
- `api/` 디렉토리는 프레임워크 설정과 무관하게 자동으로 서버리스 함수로 인식된다. npm 의존성을 쓰려면 루트에 `package.json`이 필요하다. **다만 커스텀 `buildCommand` + `installCommand: "true"` 조합에서 이게 실제로 동작하는지는 공식 문서에 명시가 없다 → 1단계 착수 시 첫 배포로 직접 확인한다.**
- Firewall Custom Rule로 경로별(Request Path Equals) 레이트리밋을 걸 수 있고 재배포가 필요 없다.
- PDF 라이브러리는 **`unpdf` 1.8.1**. `pdf-parse`는 canvas 의존성 때문에 서버리스에서 불안정하다 (ADR-013).

**Supabase Edge Function**
- 스트리밍은 `ReadableStream` + `Content-Type: text/event-stream`이 표준 패턴이고, 업스트림 벤더 SSE를 그대로 파이프할 수 있다.
- **`supabase_flutter`의 `functions.invoke()`는 스트리밍을 지원하지 않는다**(functions-js가 Promise 기반 단건 응답만 처리, 관련 이슈 저장소는 아카이브됨). → 클라이언트는 `package:http`로 Function URL에 직접 POST하고 SSE를 수동 파싱한다. 인증 헤더(`apikey`, `Authorization`, `X-Device-Id`)도 수동 구성한다 (ADR-013).

**벤더 SSE 형식 차이** (어댑터가 흡수해야 하는 부분)
- Anthropic Messages API: `event:` + `data:` 필드가 있는 SSE. `message_start` → `content_block_delta`* → `message_stop`.
- OpenAI Chat Completions: `event:` 없이 `data: {...}`만. 텍스트는 `choices[].delta.content`, 종료는 `data: [DONE]`.

**Flutter 패키지**: `file_picker` 13.1.0(6개 플랫폼), `http` 1.6.0.

**M2 코드 패턴** (그대로 따른다)
- 의존성 주입은 `Provider<T>`, 비동기 조회는 `FutureProvider<T>`(`.family` 포함), 상태 표시는 `AsyncValue.when(loading/error/data)`, 새로고침은 `ref.invalidate`.
- 모델은 `toJson`/`fromJson`, snake_case 키, `DateTime`은 `toIso8601String`.
- 테스트는 Fake 클래스 + `overrideWithValue()`. mock 라이브러리를 새로 넣지 않는다.

## 작업 목표

로그인 없이 **이력서 입력(텍스트 또는 PDF) → 지원 분야·직무 선택 → 면접 채팅 화면에서 메시지 전송 → 이력서·대화가 기기에 저장**되는 흐름을 iOS에서 완성하고, 서버 측 비회원 한도(기기 + IP)와 429 경로, LLM 어댑터 2종을 구현한다. 실제 LLM 응답 기반 종단 검증은 API 키 확보 후로 미룬다.

## 가드레일

### 반드시 지킨다

- LLM 호출과 API 키는 **Edge Function 안에만** 둔다. Flutter는 Edge Function만 호출한다.
- LLM 호출은 `LlmProvider` 인터페이스(`streamChat`)를 통해서만 한다. 호출부에서 벤더 SDK·엔드포인트를 직접 쓰지 않는다.
- 사용량 증가는 `increment_guest_usage` RPC로만 한다. 한도 숫자는 `rate_limit_config`에서 읽는다. 코드에 숫자를 하드코딩하지 않는다.
- 마이그레이션에 `GRANT`와 RLS 정책을 함께 쓴다. `guest_daily_usage`는 클라이언트 접근 불가 상태를 유지한다(Edge Function service role만).
- PDF 텍스트 추출은 Vercel Node 함수에서만 한다. 클라이언트·Edge Function에서 파싱하지 않는다. 원본 PDF는 저장하지 않는다.
- 비회원 데이터(이력서·대화)는 기기에만 저장한다. 서버에는 사용량 카운터만 남는다.
- 로컬 저장은 `lib/core/storage/local_json_store.dart`를 거친다. 위젯이 `SharedPreferencesAsync`를 직접 만지지 않는다. `{version, items}` + `_schemaVersion` 패턴을 따른다.
- feature-first + 3계층. `domain/`은 Supabase·HTTP 없이 단위 테스트 가능해야 한다.
- 에러 처리는 기존 패턴 그대로 — Exception을 던지고 UI에서 `AsyncValue.when`으로 받는다. `lib/core/error/`를 이번에 만들지 않는다.
- 새 의존성은 `file_picker`, `http` 2개까지만 추가한다.

### 하지 않는다

- 로그인 화면, `increment_daily_usage`, JWT 회원 분기, `interview_sessions`/`interview_messages`/`resumes` 테이블 쓰기 — 전부 M4.
- `mock` LLM 어댑터 추가 (ADR-013에서 도입하지 않기로 결정).
- 어드민(M5), 웹 전용 레이아웃(M6), 데스크톱 플랫폼 폴더 재생성.
- `docs/current_state.md`, `docs/work_log.md` 수정 — `/wrap` 전용이다.
- 채팅 UI 커스텀 디자인, TTS/STT, 이력서 여러 개 관리.
- 한도 숫자·대화 길이 제한을 "정확한 값"으로 확정하려 시간 쓰기 — 임시값으로 넘어간다.

## 작업 흐름

### 1단계 — Vercel PDF 파싱 함수 (`api/parse-pdf.ts`)

가장 불확실한 부분이라 먼저 한다. 여기서 막히면 뒤 단계 순서를 바꿀 수 있다.

- 루트에 `package.json` 추가(`unpdf ^1.8.1`), `vercel.json`의 `installCommand`를 npm 설치가 되도록 조정하고 Flutter 빌드가 유지되는지 확인한다.
- `api/parse-pdf.ts`: POST로 PDF 바이트 수신 → 매직바이트(`%PDF-`) 검증 → 크기 상한(4.5MB 한도 아래로, 예: 4MB)·페이지 수 상한 검사 → `unpdf`로 텍스트 추출 → JSON 반환. 위반은 4xx와 사유 코드. CORS는 앱 오리진으로 제한.
- 호출 제한은 Vercel Firewall Custom Rule(경로 기준)로 건다. 코드에 카운터를 두지 않는다.
- **인수 기준**
  - Preview 배포에서 실제 PDF를 POST하면 텍스트가 반환된다.
  - 크기 초과·비PDF·빈 본문이 각각 구분된 4xx로 거부된다.
  - **같은 배포에서 Flutter 웹 앱이 여전히 정상 로드된다**(루트 `package.json` 추가로 인한 회귀 없음).
  - Firewall 규칙이 해당 경로에 적용된 것을 대시보드에서 확인.

### 2단계 — `increment_guest_usage` RPC + `rate_limit_config` 초기값

- 새 마이그레이션 1개. SECURITY DEFINER 함수 `increment_guest_usage(p_device_key, p_ip_key, p_device_limit, p_ip_limit)`:
  - 기기·IP 두 행을 **정렬된 순서로** 잠가 데드락을 피한다(없으면 insert).
  - 둘 다 한도 안일 때만 둘 다 증가시킨다.
  - `allowed`, `blocked_by`(`device`/`ip`/null), `device_remaining`, `ip_remaining`을 반환해 앱이 문구를 구분할 수 있게 한다.
- `rate_limit_config`에 `guest_device`, `guest_ip` 행 삽입. **숫자는 미정 → 임시값(device 10 / ip 40)을 넣고, 마이그레이션 주석에 "임시값, 대시보드에서 조정 가능"을 남긴다.** ADR-006의 취지가 "재배포 없이 조정"이므로 이 단계를 뒤로 미루지 않는다.
- `execute` 권한은 service role에게만. `anon`/`authenticated`에 노출하지 않는다.
- **인수 기준**
  - `supabase db push` 성공.
  - SQL로 한도까지 연속 호출하면 초과분이 증가하지 않고 `blocked_by`가 올바르게 나온다.
  - 기기 한도만 초과 / IP 한도만 초과 두 경우가 각각 구분되어 반환된다.
  - `anon` 키로는 RPC 호출이 거부된다.

### 3단계 — `interview-chat` Edge Function

- `supabase/functions/interview-chat/`:
  - `_shared/llm/types.ts`(`LlmProvider.streamChat`), `anthropic.ts`, `openai.ts`, `factory.ts`(`LLM_PROVIDER` env, 기본 anthropic).
  - 각 어댑터가 벤더 SSE를 공통 텍스트 조각 스트림으로 정규화한다(Anthropic `content_block_delta` / OpenAI `choices[].delta.content` + `[DONE]`).
  - 프롬프트 구성: 시스템 프롬프트(면접관 역할) + 이력서 텍스트 + 분야/직무 + 이전 대화. **이력서 길이와 대화 이력 길이를 서버에서 잘라낸다**(값은 env var, 기본값 명시).
  - 한도: `X-Device-Id` + `x-forwarded-for` IP를 secrets의 salt와 함께 해시 → `rate_limit_config` 조회 → `increment_guest_usage` → 초과 시 **429 + `blocked_by`**.
  - 응답은 `ReadableStream` + `text/event-stream`. 첫 이벤트에 남은 횟수를 실어 보낸다.
  - **남은 사용량 조회 경로**: `guest_daily_usage`는 클라이언트가 못 읽으므로, 카운트를 증가시키지 않는 읽기 전용 경로를 같은 함수에 둔다(`?usage=1` 등). 앱 배너의 초기값용.
- Deno 단위 테스트: 고정 SSE 샘플 문자열을 입력으로 넣어 각 어댑터가 같은 텍스트 조각 시퀀스를 만드는지 검증. `factory.ts`가 env 값에 따라 올바른 어댑터를 돌려주는지 검증.
- **인수 기준**
  - `supabase functions deploy interview-chat` 성공.
  - 어댑터 단위 테스트 통과(벤더별 파싱 차이 포함).
  - `X-Device-Id` 없이 호출하면 400, 한도 초과 상태에서 호출하면 `blocked_by`가 담긴 429.
  - 읽기 전용 사용량 경로가 카운트를 증가시키지 않는다.
  - API 키 없이 호출하면 벤더 인증 실패가 명확한 에러로 앱까지 전달된다(500이 그대로 노출되지 않음).

### 4단계 — 이력서 feature (Flutter)

- `lib/features/resume/`를 3계층으로 신규 생성.
  - `domain/`: 이력서 모델(`sourceType`: paste/pdf, `text`, `updatedAt`, `toJson`/`fromJson`), 리포지토리 인터페이스.
  - `data/`: `LocalJsonStore` 기반 로컬 구현(키 `resume`, `{version, items}` 구조), `api/parse-pdf`를 호출하는 PDF 추출 클라이언트.
  - `presentation/`: 이력서 입력 화면 + provider.
- 화면: 텍스트 붙여넣기 입력란 + "PDF 불러오기"(`file_picker`) → 추출 텍스트를 **편집 가능한 상태로** 입력란에 채움 → 저장. 진입점은 `/me`의 이력서 관리와 모의면접 탭의 유도 경로 두 곳.
- 이력서는 **1개(덮어쓰기)**로 구현한다.
- **인수 기준**
  - 텍스트를 저장하고 앱을 재시작해도 이력서가 남아 있다.
  - PDF 선택 → 추출 텍스트가 입력란에 채워지고 수정 후 저장된다.
  - 추출 실패(크기 초과/파싱 불가/네트워크)가 각각 명확한 문구로 표시되고, 텍스트 붙여넣기로 계속 진행할 수 있다.
  - `domain` 단위 테스트 통과, in-memory fake store로 `data` 테스트 통과.

### 5단계 — 모의면접 채팅 UI

- 흐름: 모의면접 탭 → 이력서 없으면 이력서 입력 유도 → **분야·직무 선택** → 채팅. 분야는 M2의 `categories` 최상위를 재사용하고, 직무는 자유 입력으로 둔다(Open Question).
- `lib/features/interview/`를 3계층으로 채운다.
  - `domain/`: 세션·메시지 모델, 리포지토리 인터페이스(텍스트 조각 `Stream`을 반환).
  - `data/`: `LocalJsonStore` 기반 대화 저장, `package:http`로 Function URL에 POST하고 SSE를 수동 파싱하는 클라이언트(헤더 `apikey`/`Authorization`/`X-Device-Id` 직접 구성).
  - `presentation/`: 채팅 화면 + provider.
- UI: 사용자/면접관 말풍선, 스트리밍 중 부분 텍스트 누적, 하단 입력창(전송 중 비활성화), 상단 남은 사용량 배너, 429 시 기기/IP 구분 안내, 네트워크·서버 오류 재시도, "새 면접 시작"으로 대화 초기화.
- **인수 기준**
  - iOS 시뮬레이터: 메시지 전송 → 사용자 말풍선 즉시 표시 → 기기에 저장 → 앱 재시작 후 대화 유지.
  - **스트리밍 말풍선의 점진적 누적은 위젯 테스트로 검증** — 리포지토리를 스텁으로 override해 토막 문자열을 순차 emit하고 화면이 단계적으로 갱신되는지 확인(서버·API 키 불필요).
  - Edge Function이 벤더 인증 실패를 반환할 때 에러 상태와 재시도 UI가 정상 표시된다(iOS에서 실제 확인 가능한 경로).
  - `guest_daily_usage` 행을 SQL로 한도까지 올려둔 뒤 전송하면 429 안내가 기기/IP를 구분해 표시되고 입력이 막힌다.
  - 이력서 없이 채팅에 진입할 수 없다.

### 6단계 — 검증 + 문서 정합성 확인

- `flutter analyze`, `flutter test` 통과. Edge Function Deno 테스트 통과.
- iOS 시뮬레이터 전체 여정 1회: 이력서 입력(텍스트·PDF 각 1회) → 분야·직무 선택 → 메시지 전송 → 에러/한도 상태 표시 → 앱 재시작 후 이력서·대화 유지.
- Vercel Preview에서 Flutter 웹 앱 로드 회귀 재확인.
- Android는 AVD 없음으로 미확인, 웹 스트리밍은 범위 밖 — 둘 다 문서에 남긴다.
- **문서는 이미 ADR-013 / `docs/architecture.md` / `docs/roadmap.md` / `docs/overview.md`에 갱신되어 워킹트리에 있다(커밋 전).** 이 단계에서는 구현 결과가 문서와 어긋난 곳만 수정한다. 특히 1단계에서 `vercel.json` 조정 내용이 달라지면 `docs/architecture.md`를 맞춘다.
- **인수 기준**: CI 통과, PR 요약 댓글에 CI·배포 결과 정상 표시, 문서와 구현이 일치, 미검증 항목이 문서에 명시됨.

## 성공 기준 (M3 전체)

1. 로그인 없이 이력서(텍스트 또는 PDF) 입력 → 분야·직무 선택 → 채팅 화면에서 메시지 전송·기기 저장까지 iOS 시뮬레이터에서 동작한다.
2. 기기 한도·IP 한도 초과 시 각각 429가 오고, 앱이 사유를 구분해 안내한다.
3. Anthropic/OpenAI 어댑터가 `LlmProvider` 인터페이스로 구현되고, `factory.ts`가 `LLM_PROVIDER` 값에 따라 올바른 어댑터를 선택하며, 벤더별 요청 형식·SSE 파싱 차이가 단위 테스트로 검증된다.
4. 이력서와 면접 대화가 기기에만 저장되고, 서버에는 사용량 카운터만 남는다. `guest_daily_usage`는 클라이언트에서 접근할 수 없다.
5. 한도 숫자·대화 길이 제한·이력서 길이 제한이 코드에 하드코딩되지 않고 설정(DB 또는 env)에서 읽힌다.
6. `flutter analyze` / `flutter test` / Edge Function 단위 테스트 통과, Vercel Preview에서 Flutter 웹 앱 로드 회귀 없음.

## 범위 밖

- **실제 벤더 API 호출을 통한 종단 스트리밍 검증** — API 키 확보 후 별도 후속 작업 (ADR-013).
- Android 동작 확인(AVD 없음), 웹 스트리밍 동작.
- 회원 경로 전체: 로그인, `increment_daily_usage`, JWT 분기, `interview_sessions`/`interview_messages`/`resumes` 저장 (M4).
- 채팅 UI 커스텀 디자인, 면접 결과 피드백/평가 화면, 음성 대화.
- 이력서 여러 개 관리, 이력서 버전 이력.
- 4.5MB 초과 PDF 처리(Blob 업로드 경유 등).

## Open Questions

- [ ] LLM API 키 확보 시점과 벤더 — 실호출 스모크 테스트와 종단 스트리밍 검증을 어느 시점/작업에 넣을지. 성공 기준 3번이 여기에 걸려 있다.
- [ ] 사용할 모델(저가 검증용 vs 상위 품질용)과 모델명 저장 위치(env var vs DB 설정).
- [ ] 사용량 카운트 단위 — 메시지 1건 = 1 vs 면접 세션 1개 = 1. LLM 비용과 직결된다.
- [ ] `guest_device` / `guest_ip` 하루 한도 숫자. 임시값(10 / 40)으로 진행하며 출시 전 확정.
- [ ] 프롬프트에 넣을 대화 이력 길이 제한(최근 N메시지 또는 토큰 수)과 이력서 텍스트 최대 길이, 그리고 그 값을 env에 둘지 `rate_limit_config`처럼 DB에 둘지.
- [ ] 이력서를 기기에 1개만 보관할지 여러 개 보관할지 (이번 계획은 1개 덮어쓰기).
- [ ] PDF 파싱 함수의 호출 제한을 Vercel Firewall 규칙만으로 충분히 막을 수 있을지. 무인증 공개 엔드포인트라 방치할 수 없다.
- [ ] 지원 직무를 자유 입력으로 둘지 짧은 고정 목록으로 둘지.
- [ ] 웹 스트리밍 지원과 Android 확인을 M6로 넘길지 별도 후속 작업으로 뺄지.
- [ ] PDF가 Vercel 요청 본문 한도 4.5MB를 넘을 가능성 — 넘는 경우 Blob 업로드 경유 등 별도 처리가 필요한데, 이번 마일스톤에 포함할지 후속으로 뺄지.
- [ ] 루트에 npm 의존성용 `package.json`을 추가했을 때 Vercel이 `api/parse-pdf.ts`를 실제로 인식·빌드하는지 — 공식 문서로 확인하지 못했다. **1단계 착수 시 첫 배포로 직접 확인해야 하는 항목.**
- [ ] (M1 이월) `profiles` 자동 생성 트리거 시점 — M3는 비회원 전용이라 직접 영향 없음. M4에서 처리 가능.
