# 현재 상태

마지막 갱신: 2026-10-08

## 완료
- M0~M5-a, M4 후속, Next.js 웹 전환, 색상 통일, 화면 모드·음성 입력, 면접 시작 개편, 권한 상승 수정, iOS 출시 준비(방침·약관·동의 화면, 회원탈퇴와 Apple 토큰 철회, iOS 전용 Apple 로그인, iOS 출시 자산) — `develop`과 `main` 모두에 반영됨. 열린 PR 없음
- **웹 컷오버 완료(10/8)**: `main`을 `develop`과 같은 커밋으로 올렸고 Production(`https://devinterviewkr.vercel.app`)이 새 Next 웹이다. `/privacy`·`/terms`·`/api/parse-pdf`·로그인 3종이 운영 주소에서 동작한다. Supabase Site URL도 운영 도메인으로 바꿨다. 되돌릴 때는 이전 운영 배포 `devinterview-gb7tunn3q-songtaehas-projects.vercel.app`을 `vercel promote`
- **iOS 1.0.0(빌드 1)을 App Store 심사에 제출했다고 사용자가 알려옴(10/8)**. 업로드는 `xcodebuild -exportArchive`(destination upload)로 했고, 이름 `DevInterview - 개발자 면접`·카테고리 교육/비즈니스·연령 4+·앱 개인정보 게시·스크린샷 6장(1206×2622)·심사 메모를 입력했다. 첫 출시는 iPhone 전용(ADR-028)
- Apple 설정 끝: App ID의 Sign in with Apple, 키, Supabase Apple provider, `APPLE_*` secrets 4개. 실기기에서 Apple·카카오 로그인과 회원탈퇴(서버에서 계정 삭제까지) 확인
- 앱·웹 UI: 구글 로그인 복원, 로그인 성공 알림, 로그아웃·회원탈퇴 확인 팝업, 이메일 미표시, 랜덤 학습 이전/다음 숨김, 난이도 필터, 홈 카드 주제·문제 수, 웹 404·오류 화면
- 운영 DB: 마이그레이션 3개(카운터 30일 삭제 pg_cron, 세션 update 권한, advisor 보강) 적용, `interview-chat`·`delete-account` 배포

## 예정
- **심사 결과 대기**(제출 10/8, 보통 1~2일, Apple Developer 계정 메일). 승인되면 출시 방식(자동/수동) 확인. 거절되면 사유를 그대로 가져와 수정·답변 후 재제출. 빌드를 다시 올려야 하면 버전은 그대로 두고 빌드 번호만 2로(`pubspec.yaml`의 `version: 1.0.0+2`)
- **방침·약관 상단 안내 결정**: 운영 `/privacy`·`/terms` 맨 위에 "법률 자문이 아닌 초안, 시행일 2026-10-01 예정" 안내가 그대로 있다. 확정 문구로 바꾸고 시행일을 정할지 사용자 결정 필요(웹 수정이라 앱 재빌드 불필요). 방침이 거절 사유로 나오면 가장 먼저 고칠 곳
- **직접 확인 남은 것**: iPhone 설정 > Apple 계정 > Apple로 로그인 목록에서 앱이 사라졌는지, 구글 로그인 iOS 실기기, Google 계정 선택 화면 프로덕션 게시, 면접 동의 화면(앱·웹)과 설정 화면 모양. 이슈 #64의 체크리스트가 이 항목들이 끝나야 닫힌다(지금은 열려 있음)
- **확인할 의심**: 자동 촬영에서 면접 두 번째 메시지가 전송되지 않았다(첫 응답 뒤 입력창에 넣고 전송 아이콘을 눌렀는데 횟수 배너와 대화가 그대로). 테스트 조작 문제일 수도 있지만 실제 앱에서 두 번째 메시지가 가는지 확인할 것
- **CLAUDE.md**: "Safari 스트리밍 실측: 현재 미실측" 줄을 사용자가 확인한 브라우저별 결과로 갱신(결과 내용을 아직 받지 못했다)
- **TestFlight 실사용 미실시**: 배포 서명 빌드로 전체 여정(Apple 로그인·회원탈퇴 포함)을 한 번 돌려 보는 것은 하지 않았다. 심사 중·후에 해 보면 좋다
- 선택: 카카오 회원탈퇴 시 카카오 "연결 끊기" 호출(현재는 탈퇴 후 재로그인하면 동의 화면 없이 새 계정이 생긴다)
- 미결·보류: 음성 인식 기기 내 처리 강제 여부(현재 미강제, 방침에 명시), 앱 폰트 통일(한글 폰트 4종 11MB라 보류), 자기소개 AI 초안(한도·동의 설계 필요), 회원 면접 대화의 다른 기기 복원, 문제 목록 정렬, Supabase Auth 유출 비밀번호 검사(대시보드), 구글 Android OAuth·Android 출시(범위 밖), 비회원 하루 한도는 5회 그대로(심사 중 올리지 않기로 결정)
- 콘텐츠: 어드민에서 모범답안 검수(Kafka·캐시 일관성·RabbitMQ), 성능·확장성(6문제) 보충, M5-b(임베딩 키 필요). 어드민 웹앱이 Vercel에 배포돼 있지 않은 것으로 보임 — 확인 필요
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증(새 면접 시 세션 completed 포함), 어드민 콘텐츠 생성→앱 노출 E2E
- Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, `web/`)는 컷오버 안정화 후 별도 PR. 이전 주소 `myapp-teal-mu.vercel.app`은 404라 옛 빌드 앱의 PDF 불러오기는 안 된다
- 정리: 원격에 머지된 옛 브랜치가 남아 있다(`chore/64-pre-release-fixes`, `chore/gitignore-prod-env`, `chore/ios-iphone-only`, `docs/wrap-2026-10-08`, `feat/33-…`, `feat/62-random-study`). `.claude/worktrees/agent-ad93752b033accef3`도 정리 여부 확인

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Node 22, Next 16.3.6, Supabase CLI 2.104.0, Supabase ref `bmewpbkllmlikzqkxalw`. 웹 로컬 `cd webapp && npm run dev`, 앱은 `flutter run --dart-define-from-file=env/dev.json`
- **환경 파일**: `env/dev.json`·`env/prod.json`(둘 다 gitignore)에 `AUTH_REDIRECT_URL=com.doxmt.devinterview://login-callback`이 있어야 한다. 없으면 카카오·깃허브 로그인이 끝난 뒤 앱으로 돌아오지 않고 Safari `localhost`로 빠진다. `prod.json`의 `PDF_PARSE_BASE_URL`은 운영 도메인
- **iOS 빌드·배포**: `flutter build ipa --release --dart-define-from-file=env/prod.json` 후 업로드는 Transporter 없이 `xcodebuild -exportArchive -archivePath build/ios/archive/Runner.xcarchive -exportOptionsPlist <destination을 upload로 바꾼 ExportOptions> -exportPath <경로> -allowProvisioningUpdates`(Xcode에 로그인된 Apple 계정 사용). 실기기 설치는 `flutter build ios --release …` 후 `xcrun devicectl device install app --device <id> build/ios/iphoneos/Runner.app`. iPhone 개발자 모드가 필요하다(설정에 항목이 안 보이면 Mac에서 기기에 한 번 접속을 시도하면 나타난다)
- **실기기 개발용 빌드는 운영과 같은 Supabase에 붙는다**: 앱에서 회원탈퇴하면 실제 데이터가 지워진다
- 인앱 브라우저 창(iOS 카카오·깃허브 로그인)은 앱이 `closeInAppWebView()`를 불러야 닫힌다. 로그인 이벤트 처리(`auth_providers.dart`)에 두면 안 닫혀서 `main.dart`의 `MyApp`에서 처리한다
- **스크린샷 자동 촬영**: Flutter는 시뮬레이터에서 release를 지원하지 않아 debug로 돌려야 하고(`WidgetsApp.debugAllowBannerOverride = false`로 배너 숨김), 통합 테스트의 `takeScreenshot`은 테스트가 끝난 뒤에야 호스트로 전달돼 중간 화면이 안 찍힌다. 장면이 준비되면 `print`로 표시를 남기고 호스트의 감시 스크립트가 `xcrun simctl io booted screenshot`을 부르는 방식으로 했다. 이 코드는 레포에 두지 않았다. 허용 크기는 App Store Connect 칸 도움말에 정확히 나온다(15.9cm 칸은 1206×2622, 1179×2556, 2622×1206, 2556×1179)
- Mac 디스크가 거의 가득 찼었다(8.9GB 남음). 빌드가 "No space left on device"로 실패하면 `build/`, `webapp/.next`, Xcode DerivedData를 지운다
- cmux 컴퓨터 제어(Computer Use)는 이 세션에서 도우미가 실행되지 않아 쓰지 못했다. cmux 설정 > Computer Use를 껐다 켜야 한다
- Edge Function 테스트는 `cd supabase/functions && deno test --allow-env`(CI의 `functions` 잡). 새 권한이 필요한 함수는 마이그레이션을 먼저 적용하고 배포한다(이번에 반대로 해서 잠깐 실패 구간이 있었다)
- **카카오 로그인 요건**: Supabase가 항상 account_email·profile_image·profile_nickname을 요청하므로 세 동의항목이 모두 설정돼야 하고 이메일은 비즈 앱이어야 한다. 오류 코드 `KOE004`·`KOE006`(리다이렉트 URI는 플랫폼 키의 REST API 키에 등록)·`KOE205`
- **소셜 계정 자동 병합**: 같은 이메일이면 Supabase가 기존 계정에 합친다(깃허브가 어드민 계정에 합쳐짐). 새 가입 흐름은 어드민과 다른 이메일 계정으로 시험한다
- 구글 앱 로그인은 `google_sign_in`이 nonce를 지원하지 않아 Supabase `Skip nonce check`를 켜 두었다(ID 토큰 재전송 방어가 약해지는 대신 얻은 설정, ADR-025)
- **서브에이전트 결과는 재검증**: 린트·테스트·변경 범위를 직접 다시 돌린다. 방침·고지 문구는 코드와 공식 문서로 대조한 사실만 쓴다
- **여러 세션이 병행되면 문서가 뒤처진다**: `/wrap`·`/start` 전에 `git fetch`와 `gh pr list --state merged`로 실제 머지 상태를 먼저 확인한다. 작업 폴더의 미커밋 변경이 다른 세션 것일 수 있으니 `git add docs/`처럼 넓게 담지 말고 파일을 지정한다
- 격리 worktree(`isolation: worktree`)가 develop이 아닌 `main`에서 만들어진 적이 있다. worktree 작업은 시작 시 HEAD부터 확인한다
- Supabase Management API는 macOS 키체인의 Supabase CLI 토큰을 사용자 승인 후 쓴다. 시크릿은 채팅에 남기지 않고 파일·파이프로만 넘긴다. 파이썬 `urllib`은 인증서 오류가 나므로 `curl`을 쓴다
- 색상 토큰은 `webapp/app/globals.css`와 `lib/app/theme.dart`에 따로 있다(ADR-020). 화면 모드는 웹·앱 모두 기본 라이트
- 번들 ID `com.doxmt.devinterview`, 딥링크 `com.doxmt.devinterview://login-callback`, Apple 팀 ID `ZHDL628K27`, Apple 키 ID `6SR3YFD68P`(`.p8`은 사용자가 다운로드 폴더에서 안전한 곳으로 옮길 것), GitHub 기본 브랜치 `develop`(Vercel Production 브랜치 `main`, 컷오버 이후 `main`은 릴리즈 때만 푸시). 이슈의 `Closes #N`이 자동으로 닫히지 않는 경우가 있어 머지 후 `gh issue close`로 정리한다
- 모의면접 비용: 메시지 1회 평균 약 4.6원(`gpt-4.1-mini`)
