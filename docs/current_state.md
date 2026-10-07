# 현재 상태

마지막 갱신: 2026-10-06

## 완료
- M0~M5-a, M4 후속, Next.js 웹 전환(#25), 웹·앱 색상 통일(#27·#29), 화면 모드·음성 입력·PDF 한도 안내(#31), 면접 시작 개편·자기소개·로그인 3개 정리(#34), 권한 상승 수정·계정별 한도(#36) — `develop` 머지 완료
- **iOS 출시 + 웹 컷오버 계획**(`docs/plans/ios-release-cutover.md`, ADR-025~027)의 코드 단계가 `develop`에 머지됨(커밋 제목 기준): 방침·약관·설정 화면·OpenAI 전송 동의(#38, 이슈 #37), 계정 삭제 `delete-account`(#40), Apple 로그인 iOS 전용(#42), iOS 출시 자산(앱 아이콘·스플래시·Privacy Manifest·암호화 신고 키, #44), 첫 출시 구글 버튼 숨김(#46), 계정 삭제 시 Apple 토큰 철회(#48), 설계 문서 반영(#49), 방침·약관 운영자 표기(#57)
- 같은 기간(10/4) 머지된 기타 작업(이 세션에서 구현·검증하지 않음, 제목만 확인): Edge Function Deno 테스트 CI(#50), 앱 4MB 초과 PDF 사전 차단(#51), 비회원 사용량 30일 후 삭제·방침 보유기간(#52), 새 면접 시 이전 세션 completed(#53), 웹 404·오류 화면(#54), 학습하기 난이도 필터(#55), DB advisor 보강(#58), 패키지 업데이트·Android 아이콘(#59), 홈 분야 카드 주제·문제 수(#60), App Store 등록 자료 초안(#61, `docs/plans/app-store-listing.md`)
- **진행 중(미커밋)**: 이슈 #62 학습하기 랜덤 학습(앱·웹). 주제 목록 "전체 랜덤" 카드(학습하기에도 표시), 주제 문제 목록 "랜덤 문제" 버튼, 랜덤 진입 상세의 "다음 랜덤 문제" 버튼(`?random=field|topic` 쿼리). worktree `.claude/worktrees/agent-ad93752b033accef3`, 브랜치 `feat/62-random-study`. `flutter analyze`·`flutter test`(179)·webapp lint/tsc/test(99)/build 통과를 직접 재확인. **웹 dev 서버·앱 시뮬레이터 화면은 미확인**
- 외부에 이미 반영된 것: 원격 DB `resumes.self_introduction`, `interview-chat` 재배포, Supabase 로그인 provider(GitHub·Google·Kakao), 리다이렉트 허용 목록, 콘텐츠 548문제, Supabase 프로젝트 리전은 `ap-northeast-1`(도쿄, 방침에 반영)

## 예정
- **#62 `/submit` → CI 확인 → `/finish`**. 이 문서 갱신도 같은 PR에 들어간다
- **웹 컷오버(3단계)**: `main`은 아직 9/17 초기 커밋이다. 실측(브라우저별 면접 스트리밍, 비회원 데이터 로그인 이전, PDF 4MB 이하/초과, 동의 화면, 계정 삭제) 후 develop → main 푸시 → Supabase Site URL을 운영 도메인으로. 운영에는 `/api/parse-pdf`·`/privacy`·`/terms`가 아직 없어 앱의 PDF 불러오기가 운영 주소 기준으로는 실패한다. **그 전에는 main에 푸시 금지**
- **iOS 제출(5단계)**: Apple Developer 가입·승인, App ID의 Sign in with Apple, 토큰 철회용 .p8 키 상태는 이 세션에서 확인하지 못했다(확인 필요). App Store Connect 등록, 스크린샷, TestFlight 실기기 전체 여정, 심사 제출. 등록 문구 초안은 `docs/plans/app-store-listing.md`
- **직접 확인할 것**: Apple 로그인·계정 삭제(Apple 철회 포함) 실기기, 동의 화면·설정 화면·방침 페이지의 화면 모양(앱·웹, 라이트/다크), 랜덤 학습하기 화면, 음성 입력(실기기), 앱에서 깃허브·카카오 로그인
- **구글 로그인 마무리**(첫 출시에서는 버튼 숨김): iOS·Android 구글 OAuth 클라이언트, `env/dev.json`의 `GOOGLE_IOS_CLIENT_ID`, iOS `Info.plist` 복귀 스킴, Supabase 허용 클라이언트 ID/nonce 옵션. 웹은 계정 선택 화면까지만 확인했고 로그인 완료 기록 없음
- Android 출시(업로드 키스토어, Play Console)는 이번 범위 밖
- 음성 인식을 기기 내 처리로 강제할지(현재는 강제하지 않고 방침에 Apple·브라우저 처리 명시) — 계획 Open Questions에서 추적
- 회원 면접 대화를 새로고침 후 서버 기록에서 복원하는 기능 미구현. 문제 목록 정렬 미구현. 앱 폰트(웹은 IBM Plex Sans KR) 미적용
- **자기소개 AI 초안 만들기(2단계)**: 제목이 없는 이력서용, 하루 1회 제한 아이디어(미착수)
- **콘텐츠**: 어드민에서 모범답안 검수(특히 Kafka·캐시 일관성·RabbitMQ), 성능·확장성(6문제) 보충, 임베딩 후 의미 중복 전수 검사(M5-b). 게시 스크립트는 레포가 아니라 임시 폴더(scratchpad)에 있다
- 어드민 웹앱이 Vercel에 배포돼 있지 않은 것으로 보임 — 확인 필요
- **외부 콘솔(사용자 몫)**: OpenAI 결제 한도 설정, 카카오·구글 앱 이름·로고 정리
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증, 어드민 콘텐츠 생성→앱 노출 E2E, M5-b(임베딩 키)
- Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, `web/`)는 컷오버 안정화 후 별도 PR

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Node 22, Next 16.3.6, Supabase CLI 2.104.0, Supabase ref `bmewpbkllmlikzqkxalw`. 웹 로컬 `cd webapp && npm run dev`(3000번이 이미 쓰이면 3001), 앱은 `flutter run --dart-define-from-file=env/dev.json`
- **카카오 로그인 요건**: Supabase가 항상 account_email·profile_image·profile_nickname을 요청하므로 세 동의항목이 모두 설정돼야 하고 이메일은 비즈 앱이어야 한다. 오류 코드 `KOE004`(비활성)·`KOE006`(리다이렉트 URI는 플랫폼 키의 REST API 키에 등록)·`KOE205`(미설정 동의항목)
- **소셜 계정 자동 병합**: 같은 이메일이면 Supabase가 기존 계정에 합친다(깃허브가 어드민 계정에 합쳐짐). 새 가입 흐름(오답노트·이력서 이전)은 어드민과 다른 이메일 계정으로 시험해야 한다
- **서브에이전트 결과는 재검증**: 린트·테스트·변경 범위를 직접 다시 돌린다. 콘텐츠는 작성 → 독립 검증 → 중복 검사 → 게시. 서브에이전트가 사용량 한도로 중단될 수 있으니 중간 저장을 시킨다
- Supabase Management API는 macOS 키체인의 Supabase CLI 토큰을 사용자 승인 후 쓴다(`security find-generic-password`). 시크릿은 가려진 입력 창(`osascript`)으로 받고 파이프로만 넘긴다. 파이썬 `urllib`은 인증서 오류가 나므로 `curl`을 쓴다. `supabase db push`가 원격 기록 불일치로 막히면 같은 버전의 자리표시 파일을 만든다
- 색상 토큰은 `webapp/app/globals.css`와 `lib/app/theme.dart`에 따로 있다(ADR-020). 화면 모드는 웹·앱 모두 기본 라이트
- `dart format`은 기존 파일에 그대로 돌리면 120자 줄을 80자로 재정렬한다. 임시 파일은 `/tmp`가 아니라 스크래치패드에, stdin을 기다리는 명령(`cat > file`)은 heredoc과 섞지 않는다. macOS에는 `timeout` 명령이 없다
- 모의면접 비용: 메시지 1회 평균 약 4.6원(`gpt-4.1-mini`), 구독 손익분기는 서비스 구독료 월 약 63,000원 기준 9,900원·월 300회에서 구독자 8~12명
- 번들 ID `com.doxmt.devinterview`, 딥링크 `com.doxmt.devinterview://login-callback`, GitHub 기본 브랜치 `develop`(Vercel Production 브랜치 `main`). 이슈의 `Closes #N`이 자동으로 닫히지 않는 경우가 있어 머지 후 `gh issue close`로 정리했다
- **여러 세션이 병행되면 문서가 뒤처진다**: 이 세션 시작 시 로컬에서 본 `current_state.md`(10/1)와 달리 `develop`은 10/4까지 #38~#61이 머지돼 있었다. `/wrap`·`/start` 전에 `git fetch`와 `gh pr list --state merged`로 실제 머지 상태를 먼저 확인한다
- 서브에이전트(`explore`)가 근거 없이 "음성 인식 기본이 온디바이스", "면접 데이터는 클라우드에 저장" 같은 서술을 내놓았다. 방침·고지 문구는 코드와 공식 문서로 대조한 사실만 쓴다
- 격리 worktree(`isolation: worktree`)가 develop이 아닌 `main`(9/17 초기 커밋)에서 만들어져 `git reset --hard develop`으로 옮긴 적이 있다. worktree 작업은 시작 시 HEAD부터 확인한다
