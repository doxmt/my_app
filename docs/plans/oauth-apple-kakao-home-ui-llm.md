# 작업 계획: Apple/Kakao 로그인 + 홈 카드 UI + LLM 키 연결

**작성일:** 2026-09-21
**브랜치/PR:** 한 브랜치, 한 PR. 커밋만 아래 5개로 분리한다.

## 관련 문서

- [ADR-018: Apple/Kakao OAuth 추가와 홈 카드 아이콘 방식](../adr.md#adr-018-applekakao-oauth-추가와-홈-카드-아이콘-방식) — 이번 작업의 결정 근거
- [ADR-014: M4 — OAuth 제공자 범위, 데이터 이전 대상, 플랫폼별 로그인 방식](../adr.md#adr-014-m4--oauth-제공자-범위-데이터-이전-대상-플랫폼별-로그인-방식) — Apple/Kakao를 "M4 이후 후속"으로 미룬 원 결정
- [ADR-013: M3 — PDF 함수 배치, 모의면접 스트리밍 호출 방식, LLM 어댑터 검증 범위](../adr.md#adr-013-m3--pdf-함수-배치-모의면접-스트리밍-호출-방식-llm-어댑터-검증-범위) — LLM 어댑터/스트리밍 검증 범위
- [roadmap.md — "M4 이후 후속: Apple/Kakao OAuth 추가 + 홈 카드 아이콘 구현 + 딥링크 등록"](../roadmap.md)

---

## 컨텍스트

M4에서 Google/GitHub OAuth와 로컬→DB 데이터 이전이 끝났고, M5-a에서 어드민 웹앱이 배포됐다. 남은 후속 작업 네 가지를 한 PR로 묶는다.

현재 코드 상태(확인 완료):

- `lib/features/auth/data/auth_actions.dart` — `signInWithGoogle()`(Web=`signInWithOAuth`, 네이티브=`signInWithIdToken`), `signInWithGithub()`(전 플랫폼 `signInWithOAuth`, 네이티브만 `redirectTo`), `signOut()`. provider별 메서드를 그냥 나열하는 구조다.
- `lib/features/auth/data/google_auth_client.dart` — `signInAndGetIdToken()` 하나뿐. 공통 인터페이스 없음.
- `lib/features/auth/presentation/login_page.dart:62-69` — Google `ElevatedButton` + GitHub `OutlinedButton`, 안내 문구에 "Google 또는 GitHub"가 하드코딩돼 있다.
- `lib/app/app_config.dart` — `AUTH_REDIRECT_URL`을 `String.fromEnvironment`로 읽고, Google 관련 값과 함께 선택값으로 둔다(비어도 앱은 뜬다).
- `ios/Runner/Info.plist` — `CFBundleURLTypes` 없음. `android/app/src/main/AndroidManifest.xml` — VIEW/BROWSABLE intent-filter 없음(LAUNCHER만).
- **번들 ID: iOS `com.example.myApp`, Android `com.example.my_app`** (Flutter 기본값 그대로). → **확정: 두 플랫폼 모두 `com.doxmt.devinterview`, 앱 표시명 `DevInterview`, 딥링크 스킴 `com.doxmt.devinterview://login-callback`** (2026-09-21). 교체는 1단계에서 수행한다.
- `lib/features/categories/presentation/categories_page.dart:32-46` — `ListView.builder` + `ListTile(title, chevron_right)`.
- `lib/features/categories/domain/category.dart` — `id/parentId/slug/name/description/sortOrder`. 아이콘 필드 없음.
- `supabase/functions/interview-chat/index.ts:15-17` — CORS 헤더가 이미 `Access-Control-Allow-Origin: *`, `x-device-id` 허용, `OPTIONS` 처리(454행) 있음. → 5단계는 "추가"가 아니라 "실제 브라우저에서 동작 확인".
- `supabase/functions/interview-chat/providers/anthropic.ts:5` 기본 모델 `claude-sonnet-5`, `openai.ts:5` `gpt-4.1-mini`. env: `LLM_PROVIDER`(기본 anthropic), `LLM_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GUEST_HASH_SALT`.
- `supabase/.gitignore` — `.env.local`, `.env.*.local`만 있고 **`functions/.env`는 없다**. → 5단계에서 env 파일을 쓸 거면 gitignore를 먼저 보강하거나, 아예 `supabase secrets set KEY=value`로 직접 입력만 한다(권장).
- `local_data_migration_service.dart` / `supabase_migration_gateway.dart` / `auth_providers.dart:56-91` — 데이터 이전 로직은 provider 비의존. **새 provider를 추가해도 수정 불필요.**

## 작업 목표

1. Apple 로그인(iOS 네이티브 + Web/Android 리다이렉트)과 Kakao 로그인(전 플랫폼 리다이렉트)을 추가한다.
2. 모바일 OAuth 복귀가 되도록 iOS/Android에 딥링크 스킴을 등록한다.
3. 홈 화면 분야 목록을 아이콘 카드 UI로 바꾼다(DB 컬럼 추가 없음, `slug → IconData` 매핑).
4. LLM API 키를 Supabase secrets에 연결하고, Flutter 웹 빌드의 모의면접 화면이 실제 스트리밍으로 동작하는지 종단 검증한다.

## 가드레일

### 반드시 해야 할 것

- 커밋마다 `flutter analyze` + `flutter test` 통과 (CLAUDE.md Definition of Done).
- UI를 바꾸는 커밋(1·4)은 **최소 iOS 시뮬레이터 + Chrome 웹** 두 플랫폼에서 직접 확인.
- LLM 호출은 `LlmProvider` 어댑터(`streamChat`)를 반드시 경유. 호출부에서 벤더 SDK 직접 사용 금지.
- API 키는 **Supabase secrets에만** 둔다. 커밋 전 `git grep -nE "sk-ant-|sk-proj-|sk-[A-Za-z0-9]{20}|ANTHROPIC_API_KEY=|OPENAI_API_KEY=|client_secret|-----BEGIN"` 로 레포에 값이 안 들어갔는지 확인한다(`.p8` 파일 포함).
- Apple `.p8` 키 파일은 레포 밖에 보관. 실수로 추가되지 않게 `.gitignore`에 `*.p8` 추가.
- 커밋 메시지는 Conventional Commits.

### 절대 하지 말아야 할 것

- **문제/카테고리 콘텐츠를 SQL 마이그레이션이나 커밋으로 넣지 않는다.** DB 데이터는 사용자가 어드민 웹앱에서 직접 입력한다. 이번 PR의 마이그레이션은 (필요할 경우) 스키마·권한·함수 변경만.
- `docs/current_state.md`, `docs/work_log.md` 수정 금지 (`/wrap` 전용).
- `docs/adr.md`, `docs/architecture.md`, `docs/prd.md`, `docs/roadmap.md`, `docs/overview.md`는 이미 writer가 갱신했다. 계획과 달라진 점이 생기지 않는 한 건드리지 않는다.
- 인증 구조 재설계 금지. `AuthActions`에 메서드를 **추가**하는 방식을 유지한다(아래 "설계 판단" 참고).
- 데스크톱 플랫폼 폴더(`macos/`, `windows/`, `linux/`) 생성 금지.
- `categories`/`questions` 쓰기 코드를 Flutter 앱에 추가하지 않는다.

### 설계 판단: Apple 클라이언트 추상화

**권고: 공통 인터페이스를 만들지 말고 `AppleAuthClient`를 별도 클래스로 추가한다.**

- 네이티브 ID 토큰 경로를 쓰는 provider는 Google·Apple 둘뿐이고, 시그니처가 다르다 — Google은 `Future<String> signInAndGetIdToken()`, Apple은 nonce 원문을 함께 돌려줘야 한다(`(idToken, rawNonce)`).
- 공통 인터페이스를 만들면 반환 타입을 억지로 통일해야 하고, 구현체가 2개뿐이라 이득이 없다. CLAUDE.md "단일 사용처에 추상화 금지"에 해당.
- `AuthActions`는 `signInWithApple()` / `signInWithKakao()` 메서드를 추가하는 것으로 끝낸다. 로그인 화면이 provider 4개가 되면서 버튼 코드가 반복되므로, **화면 쪽만** 작은 `_ProviderButton` 위젯 또는 리스트 구성으로 정리한다(1단계).

---

## 커밋(작업 흐름)

각 커밋은 앞 커밋 위에 쌓인다. 외부 콘솔 설정은 "수동 체크리스트" 섹션에 따로 정리했고, 어느 커밋이 어떤 수동 단계에 막히는지 각 커밋 머리에 표시했다.

### 커밋 1 — `chore: 딥링크 스킴 등록 + 로그인 화면 provider 버튼 정리`

**선행 수동 단계:** M-0(번들 ID 확정), M-1(Supabase Additional Redirect URLs 등록)

작업:

1. **번들 ID·앱 이름 교체 (확정: `com.doxmt.devinterview` / `DevInterview`).** 현재 `com.example.myApp` / `com.example.my_app`은 Flutter 기본값이라 Apple App ID 등록과 App Store 제출에 쓸 수 없다. 이 커밋에서 교체하고, **교체한 값으로 Apple/Google/Kakao 콘솔을 등록한다** — 콘솔 등록 후에 바꾸면 전부 다시 해야 한다. 교체 대상:
   - iOS: `ios/Runner.xcodeproj/project.pbxproj`의 `PRODUCT_BUNDLE_IDENTIFIER`(앱·테스트 타깃 모두), `Info.plist`의 `CFBundleDisplayName`(`My App` → `DevInterview`)
   - Android: `android/app/build.gradle.kts`의 `namespace`/`applicationId`, `AndroidManifest.xml`의 `android:label`(`my_app` → `DevInterview`), `MainActivity`의 패키지 선언과 디렉토리 경로
   - Web: `web/index.html`의 title/apple-mobile-web-app-title, `web/manifest.json`의 `name`/`short_name`
   - 그대로 두는 것: `pubspec.yaml`의 Dart 패키지명 `my_app`(바꾸면 모든 import가 바뀌고 스토어에 노출되지 않음)
   - 기존 Google iOS OAuth 클라이언트 ID가 옛 번들 ID로 등록돼 있으면 새 번들 ID로 재등록하고 `GOOGLE_IOS_CLIENT_ID`/URL scheme을 갱신한다.
2. 딥링크 스킴 상수화: 스킴/호스트 값을 코드에 흩뿌리지 말고 `AUTH_REDIRECT_URL`(dart-define) 하나로 유지한다. `env/dev.json.example`에 예시 값을 채운다.
3. `ios/Runner/Info.plist`에 `CFBundleURLTypes` → `CFBundleURLSchemes`에 스킴 추가.
4. `android/app/src/main/AndroidManifest.xml`의 `MainActivity`에 `<intent-filter>` 추가 — `VIEW` + `DEFAULT` + `BROWSABLE`, `<data android:scheme="..." android:host="login-callback" />`.
5. 로그인 화면 정리: 안내 문구에서 "Google 또는 GitHub" 하드코딩을 provider 목록과 무관한 문장으로 바꾸고(예: "소셜 계정으로 로그인하면 …"), 버튼을 provider 목록 기반으로 렌더링하도록 `login_page.dart`를 정리한다. **이 커밋에서는 버튼 개수를 늘리지 않는다**(Google/GitHub 2개 유지) — 구조만 먼저 바꿔 2·3단계 diff를 작게 만든다.
6. `.gitignore`에 `*.p8` 추가.

인수 기준:

- [ ] `flutter analyze` / `flutter test` 통과.
- [ ] iOS 시뮬레이터에서 `xcrun simctl openurl booted "<스킴>://login-callback"` 실행 시 앱이 포그라운드로 뜬다.
- [ ] Android 에뮬레이터에서 `adb shell am start -W -a android.intent.action.VIEW -d "<스킴>://login-callback"` 실행 시 앱이 뜬다.
- [ ] 기존 GitHub 로그인이 iOS 실기기/시뮬레이터에서 **브라우저 → 앱 복귀까지** 완주한다(딥링크 등록 전에는 복귀가 안 되던 지점).
- [ ] 로그인 화면이 Chrome 웹과 iOS에서 이전과 동일하게 보인다(회귀 없음).

### 커밋 2 — `feat: Apple 로그인 추가`

**선행 수동 단계:** M-2(Apple Developer: App ID/Services ID/.p8/Return URL), M-3(Supabase Apple provider 설정)

작업:

1. `pubspec.yaml`에 `sign_in_with_apple` 추가.
2. `lib/features/auth/data/apple_auth_client.dart` 신규 — iOS 네이티브 흐름:
   - `Supabase.instance.client.auth.generateRawNonce()` 로 원문 nonce 생성 → SHA-256 해시를 Apple에 `nonce`로 전달 → Supabase `signInWithIdToken(provider: apple, idToken: ..., nonce: <원문>)`.
   - **구현 직전 `sign_in_with_apple` pub.dev README example과 Supabase 공식 문서를 재대조한다** (해시/원문 전달 방향을 반대로 하면 조용히 실패한다).
3. `auth_actions.dart`에 `signInWithApple()` 추가 — `Platform.isIOS`(+ `!kIsWeb`)면 네이티브, 그 외(Web/Android)는 `signInWithOAuth(OAuthProvider.apple, redirectTo: kIsWeb ? null : _authRedirectUrl)`.
   - 사용자 취소는 Google과 동일하게 조용히 무시(`AuthorizationErrorCode.canceled`), 그 외는 `AuthActionException`.
4. iOS Xcode 프로젝트에 "Sign in with Apple" Capability 추가(`Runner.entitlements`).
5. 로그인 화면에 Apple 버튼 추가.
6. Apple은 **최초 로그인에만** 이름을 준다. 현재 `handle_new_user` 트리거는 `raw_user_meta_data`의 `full_name`/`name`을 읽는데 Apple 네이티브 흐름에서는 여기에 이름이 안 들어올 수 있다. → 이름이 비면 표시명이 비는 것까지만 허용하고, `updateUser`로 굳이 저장하지 않는다(범위 최소화). 동작을 확인해 결과를 PR 설명에 남긴다.

인수 기준:

- [ ] `flutter analyze` / `flutter test` 통과.
- [ ] iOS 시뮬레이터(또는 실기기)에서 Apple 버튼 → Apple 시트 → 로그인 성공 → 홈 복귀, `currentUserIdProvider`가 값으로 바뀐다.
- [ ] Chrome 웹에서 Apple 버튼 → Apple 웹 로그인 → 앱으로 리다이렉트 복귀.
- [ ] 비회원 상태에서 오답노트 1건을 만든 뒤 Apple로 로그인하면 `wrong_notes`에 행이 생기고 로컬에서 사라진다(기존 이전 로직 회귀 확인).
- [ ] 로그인 시트를 취소하면 에러 메시지 없이 로그인 화면에 머문다.
- [ ] `git grep`으로 `.p8` 내용/Team ID/Key ID가 레포에 없음을 확인.

### 커밋 3 — `feat: Kakao 로그인 추가`

**선행 수동 단계:** M-4(Kakao Developers 콘솔), M-5(Supabase Kakao provider + "Allow users without an email")

작업:

1. **먼저 email null 내성 확인.** `handle_new_user`는 `auth.users`의 `email`을 쓰지 않고 `id`/메타데이터만 쓰므로 트리거 자체는 안전해 보인다. 앱 쪽에서 `user.email!` 같은 non-null 단언이나 이메일 표시를 하는 곳이 있는지 `lib/features/auth/`와 `/me` 화면을 확인하고, 있으면 null 허용으로 고친다. **DB 변경이 필요 없으면 마이그레이션을 만들지 않는다.**
2. `auth_actions.dart`에 `signInWithKakao()` 추가 — 전 플랫폼 `signInWithOAuth(OAuthProvider.kakao, redirectTo: kIsWeb ? null : _authRedirectUrl)`. GitHub 메서드와 동일한 모양. 네이티브 SDK 추가 없음.
3. 로그인 화면에 Kakao 버튼 추가.

인수 기준:

- [ ] `flutter analyze` / `flutter test` 통과.
- [ ] Chrome 웹에서 Kakao 로그인 성공 → 앱 복귀, `auth.users`에 `email`이 null인 행이 생긴다.
- [ ] iOS에서 Kakao 로그인 → 브라우저 → 딥링크로 앱 복귀 성공.
- [ ] 이메일이 null인 계정으로 `/me` 화면과 오답노트/이력서 화면이 예외 없이 뜬다.
- [ ] 비회원 데이터 이전이 Kakao 계정에서도 동작한다.
- [ ] 마이그레이션 파일이 추가됐다면 스키마/권한/함수 변경만 들어 있고 콘텐츠 INSERT가 없다.

### 커밋 4 — `feat: 홈 분야 카드 UI`

**선행 수동 단계:** 없음 (단, 카드가 여러 개로 보이려면 어드민에 분야 데이터가 있어야 한다)

작업:

1. `lib/features/categories/presentation/category_icons.dart` 신규 — `IconData iconForSlug(String slug)`. `switch`로 알려진 slug를 매핑하고, 기본값(`Icons.category_outlined` 등)을 반환한다. **DB 컬럼·마이그레이션 없음, `Category` 모델도 수정하지 않는다.**
2. `categories_page.dart`의 `ListView.builder` + `ListTile`을 카드 그리드/리스트로 교체. 아이콘 + 분야명 + `description`. 테마(`lib/app/theme.dart`, Material3 시드 `0xFF1F5A4A`)의 `colorScheme`만 쓰고 색을 새로 하드코딩하지 않는다.
3. 로딩/에러/빈 목록 상태는 기존 동작을 그대로 유지한다.
4. `iconForSlug`의 기본값 반환과 알려진 slug 매핑에 대한 단위 테스트 추가(`test/features/categories/presentation/category_icons_test.dart`).

인수 기준:

- [ ] `flutter analyze` / `flutter test` 통과, 신규 테스트 포함.
- [ ] 모르는 slug를 넣어도 기본 아이콘으로 렌더되고 예외가 없다.
- [ ] 카드 탭 시 기존과 동일하게 `/categories/{slug}`로 이동한다.
- [ ] iOS(좁은 폭)와 Chrome 웹(넓은 폭) 양쪽에서 오버플로 없이 보인다.
- [ ] 분야가 0개일 때 "아직 등록된 분야가 없습니다." 문구가 그대로 나온다.

### 커밋 5 — `docs: LLM 키 연결 및 웹 모의면접 검증 절차` (+ 검증 중 나온 최소 수정)

**선행 수동 단계:** M-6(LLM 키 발급 + `supabase secrets set`), M-7(Edge Function 재배포 불필요 확인)

이 커밋의 주 작업은 **검증**이다. 코드 변경은 검증에서 실제로 막히는 부분만 고친다. 새 화면을 만들지 않는다.

작업:

1. 키 등록: `supabase secrets set ANTHROPIC_API_KEY=...` (또는 OpenAI). **env 파일을 쓰지 않는다** — `supabase/.gitignore`에 `functions/.env`가 없어 사고 위험이 있다. 파일을 꼭 써야 하면 gitignore를 먼저 보강한다.
2. `LLM_PROVIDER`는 코드 기본값(anthropic)에 맡기고 굳이 설정하지 않는다. 모델을 바꿀 때만 `LLM_MODEL`을 설정한다.
3. **curl 스모크** — `Authorization: Bearer <publishable key>` + `X-Device-Id: <임의 UUID>` + 본문 `{categoryName, jobTitle, resumeText, history, message}`로 Function URL에 POST. SSE 청크가 여러 번 나눠 들어오는지, 마지막에 정상 종료되는지 확인.
4. **웹 종단 검증** — `flutter run -d chrome --dart-define-from-file=env/dev.json`으로 띄우고 모의면접 화면에서 메시지 전송:
   - [ ] 응답이 **한 번에 통째로가 아니라 글자/청크 단위로 점진 표시**된다. Flutter Web의 `package:http`는 브라우저 XHR 위에서 동작하므로 스트리밍이 버퍼링될 수 있다. 버퍼링된다면 그 사실을 기록하고, 범위 안에서 고칠 수 있으면 고치고(웹 전용 fetch/`ReadableStream` 경로), 아니면 Open Question으로 남기고 "웹은 완성 후 일괄 표시"로 받아들인다.
   - [ ] 브라우저 DevTools Network에서 CORS preflight(OPTIONS)와 본 요청이 모두 200이고 `Access-Control-Allow-Origin`이 응답에 있다 (코드상 이미 `*`이므로 확인만).
   - [ ] 남은 사용량 배너 숫자가 요청 후 감소한다(`increment_guest_usage` 동작 확인).
   - [ ] 한도 초과 시 429가 사용자에게 읽을 수 있는 메시지로 표시된다.
5. 검증 결과와 재현 절차를 이 계획 파일 하단 "검증 로그"에 추가하거나 PR 설명에 남긴다. **`docs/current_state.md` / `docs/work_log.md`에는 쓰지 않는다.**

인수 기준:

- [ ] `flutter analyze` / `flutter test` 통과.
- [ ] curl 스모크에서 SSE 청크가 2개 이상 순차 도착.
- [ ] Chrome 웹 모의면접에서 실제 LLM 답변이 표시되고 대화가 로컬에 저장된다(새로고침 후에도 대화 유지).
- [ ] `git grep`으로 API 키 문자열이 레포 어디에도 없음을 확인.
- [ ] 코드 변경이 있었다면 "검증에서 막힌 것을 푼 최소 변경"으로 설명 가능하다.

---

## 수동 체크리스트 (사용자가 외부 콘솔에서 수행)

| ID | 작업 | 막히는 커밋 |
|---|---|---|
| M-0 | **번들 ID 확정 완료 (`com.doxmt.devinterview`)** — 코드 교체는 커밋 1에서 수행. 사용자 몫: 기존 Google iOS OAuth 클라이언트 ID를 새 번들 ID로 재등록, 스토어 이름 "DevInterview" 중복 여부 직접 검색 | 1 (그리고 2·3의 콘솔 등록 전제) |
| M-1 | Supabase 대시보드 → Authentication → URL Configuration → **Additional Redirect URLs**에 `<스킴>://login-callback` 추가 | 1 |
| M-2 | Apple Developer → App ID에 "Sign in with Apple" 활성화 / **Services ID** 생성 + Website URL·Return URL(`https://<project-ref>.supabase.co/auth/v1/callback`) 등록 / **.p8 키** 발급 (Team ID, Key ID 기록) | 2 |
| M-3 | Supabase → Authentication → Providers → **Apple** 켜기. Services ID·Team ID·Key ID·.p8 입력, **Client IDs에 사용하는 모든 번들 ID 등록**(네이티브 iOS 흐름에 필수) | 2 |
| M-4 | Kakao Developers → 앱 생성 → **REST API 키**(=client_id) / Redirect URI `https://<project-ref>.supabase.co/auth/v1/callback` 등록 / **Client Secret 생성·활성화** / 카카오 로그인 ON / 동의항목 `profile_nickname`, `profile_image` (※ `account_email`은 Biz App 전용이므로 **제외**) | 3 |
| M-5 | Supabase → Providers → **Kakao** 켜기(REST API 키 + Client Secret). Authentication 설정에서 **"Allow users without an email" 활성화** | 3 |
| M-6 | LLM 키 발급 (Anthropic: platform.claude.com → Settings → API keys / OpenAI: 대시보드 발급 후 크레딧 충전) 후 `supabase secrets set ANTHROPIC_API_KEY=...` | 5 |
| M-7 | 원격 secret은 재배포 없이 반영되는지 확인. 반영 안 되면 `supabase functions deploy interview-chat` | 5 |
| M-8 | (이번 작업과 별개, 사용자가 이 세션에서 직접) 어드민 웹앱에서 분야·주제·문제 입력 — **커밋/마이그레이션 없음** | 4의 시각 확인용 |

> **운영 부채:** Apple client secret JWT는 6개월마다 갱신해야 한다. 만료 시 Apple 로그인이 전부 실패한다. 갱신 주기를 캘린더/이슈로 남길 것.

---

## 성공 기준

- 로그인 화면에 Google / GitHub / Apple / Kakao 4개 버튼이 있고, 각각 iOS와 Chrome 웹에서 로그인이 완주된다.
- iOS/Android에서 브라우저 OAuth 후 딥링크로 앱에 복귀한다.
- 홈 화면이 아이콘 카드로 바뀌고, 모르는 slug도 안전하게 기본 아이콘으로 렌더된다.
- Chrome 웹 모의면접에서 실제 LLM 응답이 표시되고, 사용량 카운터가 증가한다.
- `flutter analyze` / `flutter test` 통과, PR에 API 키·`.p8`·client secret이 없다.
- 이번 PR의 마이그레이션은 스키마/권한/함수만 (콘텐츠 INSERT 0건).

---

## Open Questions

`docs/plans/open-questions.md`의 "Apple/Kakao 로그인 + 홈 카드 UI + LLM 키 연결 - 2026-09-21" 섹션 참조.
