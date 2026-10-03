# iOS 앱스토어 출시 + 웹 컷오버

작성: 2026-10-01 · 상태: 확정 대기(사용자 "진행" 전)

## 컨텍스트

- M0~M5-a, Next 웹 전환이 `develop`에 머지됨. 운영(Production)은 9/17 Flutter 웹이고 `/api/parse-pdf`가 404라 앱의 PDF 불러오기가 운영 주소 기준으로 실패한다.
- 사용자 결정(2026-10-01)
  - 범위: **iOS 출시 + 웹 컷오버**. Android(업로드 키스토어, Play Console)는 제외
  - Apple 로그인 재도입(가이드라인 4.8), **iOS 앱에서만** 버튼 노출(`Platform.isIOS`). 웹·Android 미노출
  - 계정 삭제: 앱·웹 설정 화면에서 즉시 삭제(Edge Function + service_role)
  - 개인정보처리방침·이용약관: 자료조사로 채운 초안을 사용자가 검토. 웹 `/privacy`·`/terms`
  - 첫 사용 시 OpenAI 전송 **명시 동의 화면**(App Store 5.1.2(i), 2025 개정) — 고지만 두는 안은 기각
  - 구글 로그인은 첫 출시 제외(카카오·깃허브·Apple)
  - 일정: 품질 우선, 유동
- 사용자 몫 외부 작업: **Apple Developer Program 가입**(연 $99, 2FA, 법적 실명, 승인 소요 미확인) — 즉시 시작. 4단계와 2단계의 Apple 경로, 5단계가 이것에 막힌다. 승인 후 **Sign in with Apple capability가 켜진 App ID**와 토큰 철회용 **.p8 키** 발급도 사용자 몫.

### 확인된 코드베이스 사실

- iOS 번들 ID `com.doxmt.devinterview`, 배포 대상 iOS 15.0, 버전 `1.0.0+1`. `Info.plist`에 마이크·음성인식 문구 있음. AppIcon 세트는 존재하나 새 로고인지 미확인. `PrivacyInfo.xcprivacy` 없음. `ios/Runner/Runner.entitlements`는 비어 있음
- 릴리즈 설정은 `--dart-define-from-file=env/*.json`, `PDF_PARSE_BASE_URL`은 `lib/app/app_config.dart`의 `String.fromEnvironment`
- 회원 데이터 FK: `profiles`, `practice_attempts`, `wrong_notes`, `resumes`, `interview_sessions`(→`interview_messages`), `daily_usage`, `usage_overrides`(`20261001010000_usage_overrides.sql`) 모두 `auth.users ... on delete cascade`. `question_candidates.reviewed_by`만 `set null`. Storage 버킷은 마이그레이션에 없음
- ADR-024 유형(테이블 단위 GRANT + 권한 컬럼) 잔존 없음
- Apple 로그인 제거 커밋 `a9c1ceb`, 복원 참고 `cee8cbf`: `lib/features/auth/data/apple_auth_client.dart`, `auth_actions.dart`의 `signInWithApple`, `presentation/auth_providers.dart`, `login_buttons.dart`, `Runner.entitlements`, pubspec `sign_in_with_apple ^8.2.0` + `crypto ^3.0.7`
- 계정 삭제 버튼 위치: 앱 `lib/features/me/presentation/me_page.dart`(로그아웃 근처, 로그인 상태만), 웹 `webapp/components/views/me-view.tsx`
- 동의·고지 위치: 앱 `lib/features/interview/presentation/interview_page.dart`의 `_JobSetupForm`, 웹 `webapp/components/views/interview-view.tsx`의 `JobSetupForm`. 웹 푸터 `webapp/components/site-footer.tsx`, 로그인 `webapp/components/views/login-view.tsx`
- 음성 입력 `lib/core/speech/dictation_button.dart`는 `onDevice` 미지정 → iOS에서 오디오가 Apple 서버로 갈 수 있다고 본다

## 작업 목표

1. 운영 웹이 Next 앱이 되고 `/privacy`·`/terms`·`/api/parse-pdf`가 운영 도메인에서 동작한다
2. 회원이 앱·웹에서 계정을 즉시 삭제할 수 있다(Apple 사용자는 토큰 철회 포함)
3. 면접 첫 사용 전에 OpenAI(미국) 전송에 명시 동의를 받는다(앱·웹, 비회원 포함)
4. iOS 앱이 Apple 로그인·아이콘·스플래시·Privacy Manifest를 갖추고 TestFlight를 거쳐 심사에 제출된다

## 가드레일

**반드시**
- 컷오버(3단계) 전 `main` 푸시 금지. 컷오버는 develop → main 릴리즈 푸시 1회
- 마이그레이션이 생기면 `GRANT` + RLS 정책 함께. 권한 컬럼은 컬럼 단위 GRANT(ADR-024)
- 계정 삭제는 service_role을 쓰는 Edge Function 안에서만. 삭제 대상은 **요청 JWT의 `sub`만**(본문의 user_id 불신). service_role 키·Apple .p8는 Supabase secrets에만
- Apple 버튼은 iOS 앱에서만
- 방침·약관 초안 상단에 "법률 자문 아님" 표시, 사용자 검토 후 확정
- 고지·동의 문구는 사실대로: "이력서·채용공고·대화가 AI 응답 생성을 위해 OpenAI(미국)로 전송된다. 비회원 데이터는 기기에만 저장된다." 근거 없는 저장 위치 서술 금지
- 설계가 바뀌면 `docs/overview.md`와 해당 주제 문서를 함께 고친다(writer 후속)
- PR 전 Definition of Done 통과, UI 변경은 iOS 실기기·웹에서 확인

**금지**
- LLM 호출·키를 Flutter, Next 서버, `delete-account` 함수에 두지 않는다
- 웹에서 `interview-chat`을 Next 서버로 프록시하지 않는다
- Android 스토어 작업, 구글 로그인 마무리, Flutter 웹 빌드 경로 정리(컷오버 안정화 후 별도 PR)는 범위 밖
- Supabase가 Apple 토큰을 자동 철회한다고 가정하지 않는다
- `docs/current_state.md`, `docs/work_log.md` 수정 금지(`/wrap` 전용)

## 작업 흐름

```
[사용자, 즉시] Apple Developer 가입 ─┬─ 승인 → App ID(Sign in with Apple) + .p8 키 발급
1. 방침·약관 + 동의 화면 (웹·앱)       │
2a. 계정 삭제 — 비Apple 경로           │
3. 웹 컷오버  ← 1·2a 머지 후           │
4. Apple 로그인 (iOS 전용)  ←──────────┤
2b. 계정 삭제 — Apple 토큰 철회 ← 4 이후 ┘
5. iOS 출시 자산·제출  ← 3·4·2b 이후
```

1·2a를 컷오버 전에 끝내 운영 도메인에서 방침 URL과 계정 삭제가 살아 있게 한다. Apple 승인 전에는 2a까지만 완료할 수 있다.

## 단계별 TODO

### 1단계: 개인정보처리방침·이용약관 + OpenAI 전송 동의 화면

- 원문 재확인: law.go.kr 개인정보보호법 제28조의8(국외 이전, 처리위탁 예외 요건)·제30조(처리방침 필수 기재사항), PIPC 처리방침 작성지침 최신판, App Store Review Guidelines 5.1.2(i) 원문
- Supabase 프로젝트 리전 확인(`get_project`의 region 또는 대시보드), Vercel `parse-pdf`가 PDF 본문을 저장하지 않는지 코드로 확인
- 웹 `/privacy`·`/terms` 정적 페이지
  - 방침: 수집 항목(비회원 기기 ID·IP 해시, OAuth 프로필, 이력서·자기소개·채용공고·대화), 목적·보유기간·파기, 처리위탁·국외 이전 표(OpenAI 미국 — 학습 미사용·악용 모니터링 로그 최대 30일 / Vercel 미국 iad1 — PDF 파싱 / Supabase — 확인한 리전 / Apple — 음성 인식, 4번 결정에 따름), 각 항목에 이전 항목·국가·시기·방법·이전받는 자 명칭·연락처·목적·보유기간·거부 방법·절차·효과, 소셜 로그인 제공자(카카오·깃허브·Apple), 정보주체 권리(계정 삭제 포함), 보호책임자 연락처
  - 약관: 서비스 내용, AI 응답의 정확성 면책, 사용량 한도, 계정 삭제, 문의
- 링크: 웹 푸터·로그인 화면, 앱 내 정보(외부 브라우저로 운영 URL)
- 동의 화면(앱 `_JobSetupForm`, 웹 `JobSetupForm`): 면접 첫 시작 전 한 번, OpenAI(미국) 전송 항목·목적과 방침 링크를 보여 주고 "동의" 시 기기에 저장(앱 `shared_preferences`, 웹 `localStorage`, try/catch). 미동의면 면접 시작 불가, 문제풀이·오답노트·이력서 저장은 그대로 사용
- **인수 기준**
  - 로컬·Preview에서 `/privacy`·`/terms`가 라이트/다크로 렌더링되고 방침에 국외 이전 5항목이 OpenAI·Vercel(필요 시 Supabase·Apple) 각각에 대해 있다
  - 앱·웹 모두 동의 전에는 면접 시작 버튼이 막히고, 동의 후 재실행해도 다시 묻지 않는다(위젯 테스트 / Vitest)
  - 문제풀이 등 다른 기능은 미동의 상태에서도 동작한다
  - 사용자가 방침·약관 문구를 검토·승인했다
  - `flutter analyze`·`flutter test`, webapp lint·tsc·test·build 통과

### 2단계: 계정 삭제

**2a. 공통·비Apple 경로 (Apple 승인 전 완료 가능)**
- `supabase/functions/delete-account`: JWT 검증 → `sub`로 `auth.admin.deleteUser`. 연쇄 삭제로 회원 테이블 정리(위 FK 목록). 원격 DB에서 FK cascade를 최종 확인하는 쿼리를 PR 전에 실행
- 앱 `me_page.dart`, 웹 `me-view.tsx`에 "계정 삭제"(로그인 상태만) → 확인 대화상자 → 함수 호출 → 로그아웃 → 홈
- **인수 기준**
  - 카카오 또는 깃허브 시험 계정 삭제 후 원격 DB에서 그 user_id 행이 7개 테이블 모두 0건, `auth.users`에도 없음
  - 다른 사용자 JWT·본문 조작으로 다른 계정을 지울 수 없음(Deno 단위 테스트)
  - 삭제 후 앱·웹이 비회원 상태로 정상 동작
  - DoD 통과

**2b. Apple 사용자 토큰 철회 (4단계 이후)**
- 원문 재확인: Apple "Revoke tokens" REST API 문서(`appleid.apple.com/auth/revoke`), client_secret JWT 형식
- 권장 방식: 삭제 직전 Apple 재인증으로 새 `authorizationCode` 획득 → `delete-account`에서 .p8로 client_secret JWT를 요청마다 생성 → 코드 교환 → revoke → 사용자 삭제. .p8·Key ID·Team ID는 secrets
- **인수 기준**
  - 실기기에서 Apple 계정 삭제 시 revoke 호출이 성공(로그 확인)하고, 설정 > Apple ID > Apple로 로그인 목록에서 앱이 사라진다
  - revoke 실패 시 사용자 삭제를 진행하지 않고 오류를 알린다(또는 Open Question 결정대로)
  - 비Apple 경로 회귀 없음

### 3단계: 웹 컷오버

- 실측: 면접 스트리밍(Chrome·macOS Safari·iOS Safari), 비회원 데이터 로그인 이전, PDF 4MB 이하/초과, 카카오·깃허브 로그인, 동의 화면, 계정 삭제(비Apple)
- develop → main 푸시 → Supabase Site URL·Redirect 허용 목록을 운영 도메인으로
- iOS 릴리즈용 env 파일(`env/prod.json` 등, gitignore)에 운영 `PDF_PARSE_BASE_URL`·Supabase 값
- Safari 실측 결과를 `CLAUDE.md`에 한 줄씩 기록
- **인수 기준**
  - 운영 도메인에서 `/privacy`, `/terms`, `/api/parse-pdf`(POST), 로그인 2종, 계정 삭제가 동작
  - iOS 앱(운영 env)이 운영 주소로 PDF를 불러온다
  - 롤백 절차(Vercel 이전 배포 promote)를 확인해 둔다

### 4단계: Apple 로그인 (iOS 전용, 가입 승인 후)

- 사용자: App ID에 Sign in with Apple, Supabase Apple provider 켜고 Client IDs에 번들 ID(네이티브 전용이라 Services ID·.p8는 로그인에 불필요)
- `cee8cbf` 기준 복원: `apple_auth_client.dart`, `signInWithApple`, providers, `login_buttons.dart`(`Platform.isIOS`), `Runner.entitlements`에 Sign in with Apple, pubspec 의존성
- nonce: raw nonce → SHA-256 해시를 Apple 요청에, raw를 `signInWithIdToken`에
- 이름은 최초 로그인에서만 오므로 받으면 바로 `updateUser`로 저장
- 버튼 스타일·배치는 Apple HIG
- **인수 기준**
  - 실제 iPhone에서 Apple 로그인 성공(이메일 가리기 포함), 최초 로그인 이름이 표시명에 저장
  - 비회원 오답노트·이력서가 계정으로 이전
  - 웹·Android 빌드에 버튼 없음(위젯 테스트)
  - DoD 통과

### 5단계: iOS 출시 자산·제출

- 원문 재확인: Privacy Manifest required-reason API 문서, App Privacy 데이터 유형 목록, 스크린샷 필수 크기
- AppIcon이 새 로고인지 확인 후 교체(필요 시 `flutter_launcher_icons`), 스플래시(`flutter_native_splash` 또는 LaunchScreen 직접)
- `PrivacyInfo.xcprivacy`(UserDefaults 등 required-reason), 빌드 후 Xcode Privacy Report로 플러그인 매니페스트 포함 확인
- `Info.plist`에 `ITSAppUsesNonExemptEncryption = NO`(표준 HTTPS만)
- App Store Connect: 앱 등록, 처리방침·지원 URL, App Privacy 라벨(이메일·이름, 사용자 콘텐츠: 이력서·대화, 식별자: 기기 ID, 사용 데이터, 오디오는 음성 인식 결정에 따름 — 1단계 방침과 일치), 스크린샷, 설명·키워드, 연령 등급, 심사 메모(비회원으로 전 기능 이용 가능, 계정 삭제 위치, 동의 화면 위치)
- TestFlight 내부 테스트 → 심사 제출
- **인수 기준**
  - Archive 업로드 성공, Privacy Report에 누락 경고 없음
  - TestFlight 실기기 전체 여정 통과: 문제풀이 → 오답노트 → 이력서(PDF) → 동의 → 면접 → Apple·카카오·깃허브 로그인 → 계정 삭제(Apple 철회 포함)
  - App Privacy 라벨과 방침 대조 점검표 완료
  - 상태 "Waiting for Review"

## 성공 기준

- 운영 웹이 Next이고 방침·약관·PDF·로그인·계정 삭제가 운영 도메인에서 동작
- iOS 앱이 4.8(Apple 로그인), 5.1.1(v)(앱 내 계정 삭제), 5.1.2(i)(AI 제공자 전송 명시 동의)를 충족해 심사 제출됨
- 모든 PR CI 통과, `main` 푸시는 컷오버 1회

## Open Questions

`docs/plans/open-questions.md`의 "iOS 앱스토어 출시 + 웹 컷오버 - 2026-10-01" 절에서 추적한다.

## 계획 확정 뒤 writer 후속 작업

main command가 계획 확정 후 writer를 호출해 아래를 갱신한다(`current_state.md`·`work_log.md` 제외).
1. `docs/roadmap.md`: 출시 마일스톤(iOS + 컷오버, Android는 이후) 추가
2. `docs/adr.md`: ADR-025 iOS 우선 출시 + Apple 로그인 iOS 전용 재도입(ADR-022 부분 정정, 토큰 철회용 .p8 보관), ADR-026 계정 삭제는 Edge Function + service_role 즉시 삭제, ADR-027 면접 첫 사용 OpenAI 전송 명시 동의(기기 저장)
3. `docs/architecture.md`: Edge Function 목록에 `delete-account`, 웹 라우트 `/privacy`·`/terms`, 로그인 방식(Apple iOS 네이티브), 동의 상태 로컬 저장
4. `docs/prd.md`: 로그인 구성(카카오·깃허브·Apple(iOS), 구글 보류), 계정 삭제, 동의 화면
5. `docs/overview.md`: 위와 동일하게 맞춤
