# M4. OAuth 회원가입 (Google + GitHub)

작성일: 2026-09-18
대상: `docs/roadmap.md`의 M4
선행: M3 (PR #10) 머지 완료 (`a139193`)
결정: `docs/adr.md` ADR-014

## 컨텍스트

M0~M3이 develop에 머지됐다. 지금까지 앱에는 로그인이 전혀 없고 모든 사용자가 비회원이다.

- **DB 스키마는 이미 다 있다.** `20260917082153_init_schema.sql`에 회원용 테이블(`profiles`, `wrong_notes`, `resumes`, `interview_sessions`, `interview_messages`, `daily_usage`)과 RLS·GRANT가 전부 들어가 있다. **M4에서 새 테이블은 필요 없다.**
- **비어 있는 건 세 가지다.** ① `profiles` 자동 생성 트리거 없음 ② `increment_daily_usage` RPC 없음(현재 함수는 `increment_guest_usage` 하나뿐) ③ `rate_limit_config`에 `free` 행 없음(현재 `guest_device` 10 / `guest_ip` 40만 있음).
- **로컬 저장소는 세 개 키다.** `lib/core/storage/local_json_store.dart` 위에 `wrong_notes`(여러 개) / `resume`(1개 덮어쓰기) / `interview_session`(1개) — 각각 `lib/features/*/data/local_*_repository.dart`. 키당 `{version, items}` 구조를 통째로 read-modify-write 한다.
- **`lib/features/auth/`는 디렉토리 자체가 없다.** 로그인 화면, `authStateProvider`, 라우터 가드가 전부 이번에 처음 생긴다.
- **답변 시도 기록은 애초에 저장하지 않는다** (ADR-012). 이전할 로컬 데이터에 `practice_attempts`는 없다.

### 인터뷰에서 확정된 사항

| 항목 | 결정 |
|---|---|
| OAuth 제공자 | **Google + GitHub만.** Apple(Developer Program 유료 가입 필요) / Kakao는 이번 범위 밖 |
| 데이터 이전 대상 | **오답노트 + 이력서만.** 과거 면접 대화는 이전하지 않고 버림 |
| 이전 방식 | 로그인 성공 직후 **자동, 확인 화면 없음**. 실패해도 로그인은 성공 처리 |
| 충돌 처리 | **서버 우선.** 서버에 이력서가 있으면 로컬 이력서를 올리지 않음. 오답노트는 `unique(user_id, question_id)` 기준 중복 무시 병합 |
| 로컬 삭제 | **업로드에 성공한 항목만** 삭제 |
| Google 로그인 방식 | Android/iOS는 `google_sign_in` 7.x 네이티브 + `signInWithIdToken`, Web은 `signInWithOAuth` 리다이렉트 |
| GitHub 로그인 방식 | 전 플랫폼 `signInWithOAuth` (네이티브 SDK 없음) |
| LLM API 키 | **여전히 없음.** M4 작업 자체는 키가 필요 없다 |

### 사전 조사 결과 (document-specialist)

- **`google_sign_in` 최신은 7.2.0**이고 7.0.0에서 대대적 breaking change가 있었다. `GoogleSignIn.instance` 싱글턴 + 다른 메서드 호출 전 `initialize()` await 필수, 인증/인가가 별도 단계로 분리됐다. Supabase 공식 문서는 여전히 **네이티브 + `signInWithIdToken` 조합을 권장**하고 코드 예시도 7.x 스타일로 갱신돼 있다.
  단, supabase/supabase#36775(Open)에 "7.x 출시 직후 문서가 한동안 outdated였다"는 신고가 있다. → **구현 직전 pub.dev README/example로 재대조 필수** (M3에서 `file_picker` API가 조사 내용과 달랐던 전례).
- **Supabase Redirect URL allowlist는 glob(`*`, `**`, `?`, `[...]`)을 지원**한다. Vercel Preview 공식 예시는 `https://*-<team-or-account-slug>.vercel.app/**`. Production Site URL은 고정 도메인으로 정확히 등록하고, glob은 로컬/프리뷰 전용 별도 항목으로 추가하는 것이 문서 권장 패턴이다.
- (참고, 이번 범위 아님) **Supabase는 Kakao를 기본 제공자로 지원**한다. 커스텀 OIDC가 필요 없고, Kakao Developers 콘솔에서 REST API 키 + Client Secret 발급 → Supabase 콜백 URL 등록 → Consent Items 활성화가 필요하다. 이메일 scope를 안 받으면 "Allow users without an email" 옵션이 필요하다.

### 리스크

**M3의 LLM 어댑터는 실제 Anthropic/OpenAI 키로 한 번도 호출된 적이 없다** (Deno 단위 테스트 + 배포 엔드포인트 curl 스모크만). M4 작업 자체는 LLM 키를 필요로 하지 않고, 회원 경로도 429 / DB 저장 / 분기까지는 키 없이 검증할 수 있다. 하지만 **"회원으로 실제 면접 대화가 끝까지 된다"는 M4가 끝난 뒤에도 미검증으로 남는다.** 키 확보 시 M3 어댑터 스모크 + iOS 종단 스트리밍 + 회원 경로 종단을 한 작업으로 묶는 것을 권한다 (Open Questions 참고).

## 작업 목표

비회원이 Google 또는 GitHub로 가입하면, 기기에 쌓아둔 오답노트와 이력서가 계정으로 넘어가고, 이후 학습 데이터는 DB 기준으로 동작하며, 모의면접에 `free` 한도가 적용된다.

## 가드레일

### 반드시 할 것

- 마이그레이션마다 `GRANT` + RLS 정책을 함께 쓴다. 새 RPC는 **`service_role` GRANT까지 확인**한다 (M3에서 누락을 겪었다).
- 한도 숫자는 `rate_limit_config`에서 읽는다. 코드에 하드코딩하지 않는다.
- 사용량 증가는 `increment_daily_usage` RPC로만 한다.
- 로컬 데이터는 **업로드에 성공한 항목만** 삭제한다. 실패 시 로컬에 남겨 재시도가 가능해야 한다.
- 리포지토리는 기존 인터페이스(`WrongNoteRepository`, `ResumeRepository`)를 유지한 채 Supabase 구현체를 추가하고, 로그인 여부로 고른다. **화면 코드는 회원/비회원을 몰라야 한다.**
- LLM 호출과 API 키는 Edge Function 안에만 둔다. 회원 경로도 `LlmProvider` 어댑터를 거친다.
- `google_sign_in`은 7.x breaking change가 있다. **구현 직전 pub.dev README/example로 API를 재확인**한다.
- postgrest Dart 클라이언트의 `.order()`는 `ascending` 기본값이 `false`다. 정렬이 필요한 새 쿼리에 `ascending: true`를 명시한다.

### 하지 말 것

- 익명 로그인 사용 금지. 비회원은 여전히 Auth 세션 없이 쓴다 (ADR-003).
- 과거 면접 대화를 DB로 올리지 않는다.
- Apple / Kakao 제공자를 이번에 추가하지 않는다.
- 비회원 경로(기존 M2/M3 흐름)를 건드리지 않는다. 회원 경로는 **분기로 추가**한다.
- 어드민(`is_admin`) 관련 화면·기능을 만들지 않는다 (M5).
- `docs/current_state.md` / `docs/work_log.md`를 수정하지 않는다 (`/wrap` 전용).

## 작업 흐름

### 1단계. DB — `profiles` 트리거 + `increment_daily_usage` + `free` 한도

새 마이그레이션 하나에 세 가지를 담는다.

- `handle_new_user()` 트리거로 `auth.users` insert 시 `profiles` 행 생성 (`security definer`). **M1부터 미뤄둔 open question을 여기서 닫는다.**
- `increment_daily_usage(p_user_id, p_limit)` — `update ... where count < limit` 한 문장으로 체크와 증가를 같이 하는 패턴 (ADR-006, `increment_guest_usage`와 동일한 방식).
- `rate_limit_config`에 `free` 행 삽입.

**인수 기준**
- `supabase db push` 성공. 대시보드에서 테스트 계정을 만들면 `profiles` 행이 자동 생성된다
- `increment_daily_usage`를 한도 초과까지 반복 호출하면 한도 이후 실패를 반환하고 **카운트가 한도를 넘지 않는다** — SQL로 직접 확인
- `service_role` / `authenticated`에 대한 GRANT가 의도대로 들어갔음을 `has_function_privilege`로 확인
- 기존 `increment_guest_usage`는 그대로 동작한다

### 2단계. OAuth 설정 + 로그인 화면

- Google Cloud Console에 Web / iOS / Android 클라이언트를 등록하고, GitHub OAuth App을 만든다. 둘 다 Supabase 대시보드의 provider 설정에 연결한다.
- Supabase Redirect URL allowlist에 **Production 고정 도메인 + Vercel Preview glob(`https://*-<team-slug>.vercel.app/**`) + 로컬**을 등록한다.
- `lib/features/auth/`를 추가한다: 로그인 화면, `authStateProvider`, 로그인/로그아웃 동작. `/me`에서 로그인 진입점과 계정 정보를 보여준다.
- **Google은 Android/iOS에서 네이티브(`google_sign_in` 7.x + `signInWithIdToken`), Web에서 `signInWithOAuth` 리다이렉트로 분기한다. GitHub는 전 플랫폼 `signInWithOAuth`다.**

**인수 기준**
- iOS 시뮬레이터에서 Google·GitHub 로그인이 각각 성공하고, `supabase.auth.currentUser`가 채워지며 `/me`에 계정 정보가 보인다
- Web(로컬 `flutter run -d chrome`)에서 Google·GitHub 리다이렉트 로그인이 성공하고 앱으로 되돌아온다
- 로그아웃 후 앱을 재시작하면 비회원 상태로 돌아가고 기존 비회원 흐름이 그대로 동작한다
- 로그인 취소·실패 시 앱이 죽지 않고 에러 메시지를 보여준다
- `flutter analyze` / `flutter test` 통과

### 3단계. 오답노트·이력서 Supabase 리포지토리 + 로그인 분기

`SupabaseWrongNoteRepository` / `SupabaseResumeRepository`를 추가하고, provider가 로그인 여부로 로컬/Supabase 구현을 고른다. domain 모델과 리포지토리 인터페이스는 그대로 둔다.

**인수 기준**
- 로그인 상태에서 오답노트 저장·해결 처리·목록이 DB에 반영되고, 로그아웃 후 다시 로그인해도 유지된다
- 로그인 상태에서 이력서 입력·조회가 `resumes` 테이블 기준으로 동작한다
- **비회원 상태의 동작은 이전과 동일하다** (기존 테스트 통과)
- 다른 계정으로 로그인하면 앞 계정의 데이터가 보이지 않는다
- 리포지토리 선택 로직에 단위 테스트가 있다 (provider override로 Supabase 없이)

### 4단계. 가입 시 로컬 데이터 이전

로그인 성공 직후 **자동으로, 확인 화면 없이** 백그라운드에서 오답노트와 이력서를 업로드한다.

- 오답노트: `unique(user_id, question_id)` 기준 중복 무시 병합
- 이력서: **서버에 이미 있으면 올리지 않는다** (서버 우선)
- **업로드에 성공한 항목만** 로컬에서 삭제한다
- 업로드가 실패해도 로그인은 성공으로 처리하고, 로컬 데이터를 보존해 재시도가 가능하게 둔다
- 과거 면접 대화(`interview_session` 키)는 올리지 않는다

**인수 기준**
- 비회원으로 오답노트 여러 개 + 이력서를 만든 뒤 가입하면, 로그인 직후 `/me/wrong-notes`와 이력서 화면에 그대로 보이고 DB에도 행이 있다
- 같은 기기에서 로그아웃 → 재로그인해도 오답노트가 중복 생성되지 않는다
- 서버에 이력서가 이미 있는 계정으로 로그인하면 **서버 이력서가 유지되고 로컬 이력서는 지워지지 않는다**
- 업로드를 강제로 실패시키면(네트워크 차단) 로그인은 성공하고 **로컬 데이터가 보존된다**
- `interview_sessions` / `interview_messages`에 과거 대화가 들어가지 않는다
- 이전 로직에 단위 테스트가 있다 (중복 병합 / 서버 우선 / 부분 실패)

### 5단계. `interview-chat` 회원 경로 + 회원 한도 UI

Edge Function에 JWT 분기를 넣는다.

`Authorization` 헤더의 JWT로 `user_id` 확인 → `rate_limit_config`의 `free` 한도로 `increment_daily_usage`(초과 시 429) → **DB의 이력서·대화 이력**으로 프롬프트 구성 → 응답을 `interview_messages`에 저장. 클라이언트는 로그인 시 JWT를 실어 보내고, 남은 사용량 배너를 회원 기준으로 표시한다.

> 착수 전 확인 필요: 현재 비회원 경로가 **남은 사용량을 클라이언트에 어떻게 돌려주는지**(응답 헤더 / 본문 / 별도 조회). 회원 배너를 같은 방식에 맞춘다.

**인수 기준**
- Deno 단위 테스트: JWT 있음 → 회원 경로, 없음 → 기존 비회원 경로로 분기
- 배포 후 유효한 JWT로 curl 호출하면 `daily_usage` 행이 증가하고 `interview_sessions` / `interview_messages`에 행이 쌓인다
- `free` 한도를 소진한 계정으로 호출하면 429가 오고 앱에 한도 초과 안내가 뜬다
- **비회원 호출은 여전히 `guest_daily_usage`로 카운트된다** (회원 경로 추가로 인한 회귀 없음)
- 남은 사용량 배너가 회원일 때 `free` 한도 기준 숫자를 보여준다
- **실제 LLM 응답을 받는 종단 검증은 이 단계에 포함하지 않는다** (키 미확보). 429 / DB 저장 / 분기까지만 검증한다

## 성공 기준

- 비회원으로 쌓은 오답노트와 이력서가 Google/GitHub 가입 후 계정에 남아 있다
- 다른 계정으로 로그인하면 앞 계정 데이터가 보이지 않는다
- 회원은 `free` 한도, 비회원은 `guest_device` / `guest_ip` 한도가 각각 적용되고 초과 시 429가 뜬다
- `flutter analyze` / `flutter test` / Deno 테스트 전부 통과
- iOS 시뮬레이터와 Web(로컬)에서 **가입 → 데이터 이전 → 모의면접 진입**까지 직접 탭해서 확인

## Open Questions

> 마스터 목록은 `docs/plans/open-questions.md`의 `## M4 OAuth 회원가입 - 2026-09-18` 섹션이다.

- [ ] `free` 일일 한도 숫자 — 1단계 마이그레이션에 넣어야 한다. `guest_device` 10의 몇 배로 잡을지, 임시값으로 진행하고 출시 전 확정할지
- [ ] Vercel 팀/계정 슬러그 — Preview URL glob 등록에 필요. 2단계 시작 시 Vercel 프로젝트 설정에서 확인
- [ ] `profiles` 트리거 vs 앱에서 upsert — 트리거를 전제로 계획했으나 `auth` 스키마 트리거는 마이그레이션 관리가 까다롭다는 지적이 있다. 1단계 착수 시 확정 (M1부터 이월)
- [ ] 로그아웃 시 로컬 데이터 처리 — 4단계에서 로컬을 비우고 나면 로그아웃 후 비회원 상태엔 아무것도 없다. 의도한 동작인지, 마지막 회원 데이터를 남겨둘지
- [ ] 가입 시 면접 대화가 사라진다는 것을 사용자에게 알릴지 — 조용히 버릴지, 안내 문구를 띄울지
- [ ] `google_sign_in` 7.x 실제 API — 조사상 `GoogleSignIn.instance` + `initialize()` + `attemptLightweightAuthentication()` 이지만 Supabase 문서 outdated 신고(supabase/supabase#36775)가 있다. 2단계 구현 직전 재확인 필수
- [ ] 회원 남은 사용량 조회 경로 — `daily_usage`는 본인 읽기만 가능하다. 클라이언트에서 직접 select할지, Edge Function 응답으로 내려줄지
- [ ] (M3 이월) LLM API 키 확보 시점 — M4가 끝나도 "회원으로 실제 면접 대화가 된다"는 미검증으로 남는다. 키 확보 시 M3 어댑터 스모크 + iOS 종단 스트리밍 + 회원 경로 종단을 한 작업으로 묶을지
- [ ] (향후) Apple / Kakao 추가 시점 — Apple은 앱스토어 출시 전 사실상 필수(Developer Program 유료 가입 선행). M6 이전 별도 작업으로 뺄지
