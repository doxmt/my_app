# 현재 상태

마지막 갱신: 2026-10-08

## 완료
- M0~M5-a, M4 후속, Next.js 웹 전환, 색상 통일, 화면 모드·음성 입력, 면접 시작 개편, 권한 상승 수정 — `develop` 머지 완료
- **iOS 출시 + 웹 컷오버 계획**(`docs/plans/ios-release-cutover.md`, ADR-025~027)의 코드 단계 전부 `develop`에 머지됨: 방침·약관·동의 화면(#38), 계정 삭제(#40)와 Apple 토큰 철회(#48), Apple 로그인 iOS 전용(#42), iOS 출시 자산(#44), 방침 운영자 표기(#57)
- 그 밖에 머지된 것: Deno 테스트 CI 잡(#50), 앱 PDF 4MB 사전 차단(#51), 비회원 카운터 30일 삭제(#52), 새 면접 시 이전 세션 completed(#53), 웹 404·오류 화면(#54), 난이도 필터(#55), DB advisor 보강(#58), 패키지 업데이트·Android 아이콘(#59), 홈 카드 주제·문제 수(#60), 스토어 등록 자료 초안(#61), 학습하기 랜덤 학습(#63)
- **Apple 쪽 설정 끝남(10/8)**: App ID `com.doxmt.devinterview`의 Sign in with Apple, 키 발급, Supabase Apple provider, secrets 4개(`APPLE_TEAM_ID`·`APPLE_KEY_ID`·`APPLE_CLIENT_ID`·`APPLE_PRIVATE_KEY`). 키로 만든 서명을 Apple 서버가 받아들이는 것까지 확인
- iPhone 실기기에 개발용 빌드 설치 완료(개발자 모드 켬)
- 운영 DB 마이그레이션 3개(`20261004000000`~`20261004020000`) 적용, `interview-chat`·`delete-account` 재배포

## 예정
- **실기기 확인(진행 중)**: 카카오 로그인은 `AUTH_REDIRECT_URL`을 `env/dev.json`에 넣고 재설치한 뒤 재시도 결과를 아직 못 봤다. 남은 것: Apple 로그인(이름 저장), Apple 계정 삭제(재인증 화면, 삭제 후 iPhone 설정의 Apple로 로그인 목록에서 앱이 사라지는지), 깃허브·구글 로그인, 면접 동의 화면, 설정 화면, 난이도 필터·홈 카드·랜덤 학습 화면, 아이콘·스플래시, 회원으로 면접 2회 시작해 첫 대화가 섞이지 않는지. 개발용 빌드는 운영과 같은 Supabase에 붙으므로 계정 삭제는 실제 데이터를 지운다 — Apple 시험 계정으로 할 것
- **이슈 #64 `chore/64-pre-release-fixes`**: 다른 세션의 미커밋 변경 17개(구글 로그인 복원, 푸터·로그인 화면·면접 배너 정리, 운영 도메인 `devinterviewkr.vercel.app` 반영, 문서 갱신)가 작업 폴더에 남아 있다. 검증 후 커밋·PR·머지 필요. 체크리스트에 남은 것: 방침 5절 문구 확인(코드는 이미 구글·Apple 반영돼 있음), 구글 iOS 실기기 확인, 동의 화면 프로덕션 게시 확인
- **웹 컷오버(3단계)**: `main`은 아직 9/17 초기 커밋이다(develop이 57커밋 앞섬). 실측(Chrome·macOS Safari·iOS Safari의 면접 스트리밍, 비회원 데이터 로그인 이전, PDF 4MB 이하/초과, 동의 화면, 계정 삭제) 후 develop → main 푸시 → **Supabase Site URL을 운영 도메인으로**(지금 `http://localhost:3000`). 그 전에는 main에 푸시 금지. 운영 주소에는 `/privacy`·`/terms`·`/api/parse-pdf`가 아직 없다
- **iOS 제출(5단계)**: App Store Connect 앱 등록·스크린샷·TestFlight 전체 여정·심사 제출. 문구 초안은 `docs/plans/app-store-listing.md`(글자 수 제한은 입력 화면에서 재확인). 운영 env(`env/prod.json`, gitignore) 만들기. Xcode Privacy Report 확인
- **제출 전 결정**: 방침·약관 상단의 "법률 자문이 아닌 초안, 시행일 2026-10-01 예정" 안내를 확정 문구로 바꿀지, 시행일 확정
- **보관**: `~/Downloads/AuthKey_6SR3YFD68P.p8`은 다시 받을 수 없다. 안전한 곳으로 옮기고 레포에 넣지 않는다
- 미결·보류: 음성 인식을 기기 내 처리로 강제할지(현재 미강제, 방침에 명시), 앱 폰트 통일(한글 폰트 4종 11MB라 보류), 자기소개 AI 초안(한도·동의 설계 필요), 회원 면접 대화의 다른 기기 복원, 문제 목록 정렬, Supabase Auth의 유출 비밀번호 검사(대시보드 설정), 구글 로그인 웹 완료 기록·Android OAuth, Android 출시(범위 밖)
- 콘텐츠: 어드민에서 모범답안 검수(Kafka·캐시 일관성·RabbitMQ), 성능·확장성(6문제) 보충, M5-b(임베딩 키 필요). 어드민 웹앱이 Vercel에 배포돼 있지 않은 것으로 보임 — 확인 필요
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증(새 면접 시 세션 completed 포함), 어드민 콘텐츠 생성→앱 노출 E2E
- Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, `web/`)는 컷오버 안정화 후 별도 PR
- `.claude/worktrees/agent-ad93752b033accef3`(브랜치 `feat/62-random-study`)는 #63 머지 후에도 남아 있다. 정리 여부 확인

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Node 22, Next 16.3.6, Supabase CLI 2.104.0, Supabase ref `bmewpbkllmlikzqkxalw`. 웹 로컬 `cd webapp && npm run dev`, 앱은 `flutter run --dart-define-from-file=env/dev.json`
- **`env/dev.json`에 `AUTH_REDIRECT_URL=com.doxmt.devinterview://login-callback`이 있어야 한다.** 없으면 카카오·깃허브 로그인이 끝난 뒤 앱으로 돌아오지 않고 Safari의 `localhost`로 빠진다(Supabase가 Site URL로 돌려보냄). `env/dev.json.example`에는 이미 있다. Apple 로그인은 브라우저를 거치지 않아 무관하다
- iPhone 실기기 설치는 개발자 모드가 필요하다. 설정에 항목이 안 보이면 `xcrun devicectl device info details --device <id>`처럼 Mac에서 기기에 한 번 접속을 시도하면 나타난다. 설치는 `flutter build ios --release --dart-define-from-file=env/dev.json` 후 `xcrun devicectl device install app --device <id> build/ios/iphoneos/Runner.app`
- Edge Function 테스트는 `cd supabase/functions && deno test --allow-env`(CI의 `functions` 잡). `--allow-env` 없이는 env를 읽는 테스트가 실패한다
- **마이그레이션과 함수 배포 순서**: 새 권한이 필요한 함수는 마이그레이션을 먼저 적용하고 배포한다(이번에 반대로 해서 잠깐 실패 구간이 있었다). `supabase db push`는 로컬에 없는 원격 마이그레이션이 있으면 막히므로 브랜치 사이를 오갈 때 파일을 확인한다
- **카카오 로그인 요건**: Supabase가 항상 account_email·profile_image·profile_nickname을 요청하므로 세 동의항목이 모두 설정돼야 하고 이메일은 비즈 앱이어야 한다. 오류 코드 `KOE004`·`KOE006`(리다이렉트 URI는 플랫폼 키의 REST API 키에 등록)·`KOE205`
- **소셜 계정 자동 병합**: 같은 이메일이면 Supabase가 기존 계정에 합친다(깃허브가 어드민 계정에 합쳐짐). 새 가입 흐름은 어드민과 다른 이메일 계정으로 시험한다
- **서브에이전트 결과는 재검증**: 린트·테스트·변경 범위를 직접 다시 돌린다. 서브에이전트가 근거 없이 "음성 인식 기본이 온디바이스" 같은 서술을 낸 적이 있어, 방침·고지 문구는 코드와 공식 문서로 대조한 사실만 쓴다
- **여러 세션이 병행되면 문서가 뒤처진다**: `/wrap`·`/start` 전에 `git fetch`와 `gh pr list --state merged`로 실제 머지 상태를 먼저 확인한다. 작업 폴더의 미커밋 변경이 다른 세션 것일 수 있으니 `git add docs/`처럼 넓게 담지 말고 파일을 지정한다
- 격리 worktree(`isolation: worktree`)가 develop이 아닌 `main`에서 만들어진 적이 있다. worktree 작업은 시작 시 HEAD부터 확인한다
- Supabase Management API는 macOS 키체인의 Supabase CLI 토큰을 사용자 승인 후 쓴다. 시크릿은 채팅에 남기지 않고 파일·파이프로만 넘긴다. 파이썬 `urllib`은 인증서 오류가 나므로 `curl`을 쓴다
- 색상 토큰은 `webapp/app/globals.css`와 `lib/app/theme.dart`에 따로 있다(ADR-020). 화면 모드는 웹·앱 모두 기본 라이트
- 번들 ID `com.doxmt.devinterview`, 딥링크 `com.doxmt.devinterview://login-callback`, Apple 팀 ID `ZHDL628K27`, GitHub 기본 브랜치 `develop`(Vercel Production 브랜치 `main`). 이슈의 `Closes #N`이 자동으로 닫히지 않는 경우가 있어 머지 후 `gh issue close`로 정리한다
- 모의면접 비용: 메시지 1회 평균 약 4.6원(`gpt-4.1-mini`)
