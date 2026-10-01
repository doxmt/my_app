# 현재 상태

마지막 갱신: 2026-10-01

## 완료
- M0~M5-a, M4 후속, Next.js 웹 전환(PR #25), 웹·앱 색상 통일(PR #27·#29), 화면 모드·음성 입력·PDF 한도 안내(PR #31) — `develop` 머지 완료
- **PR #34 (열림, 머지 대기)**: 면접 시작 개편(직무 + 선택 채용공고, ADR-023), 자기소개 저장·추출·"자기소개로 시작하기"(앱·웹), 면접→이력서 저장→면접 복귀, 음성 입력 표시 강화, 로그인 3개 축소·애플 제거(ADR-022), 히어로 데모 애니메이션, 로고 에셋·웹 메타데이터·아이콘, 마이그레이션 기록 3개. 최초 푸시 때 CI 통과, 이후 푸시로 재실행 중
- **외부에 이미 반영된 것**: 원격 DB `resumes.self_introduction` 컬럼, `interview-chat` 재배포(채용공고), Supabase 로그인 provider(GitHub·Google·Kakao) 켜짐, 리다이렉트 허용 목록, 콘텐츠 548문제(백엔드 81·모바일 137 등), AI/ML 재분류
- 깃허브·카카오 로그인은 웹에서 동작 확인

## 예정
- **PR #34 머지**(`/finish`). 머지해도 운영(Production)은 안 바뀐다
- **구글 로그인 마무리**: 웹은 계정 선택 화면까지만 확인(본인 확인 중단), 로그인 완료 기록 없음. 앱은 iOS·Android 구글 OAuth 클라이언트 생성 + `env/dev.json`의 `GOOGLE_IOS_CLIENT_ID` + iOS `Info.plist` 복귀 스킴 + Supabase 허용 클라이언트 ID/nonce 옵션이 필요
- **운영 배포(컷오버)**: 실측(브라우저별 면접 스트리밍, 비회원 데이터 로그인 이전, PDF 4MB 이하/초과) 후 develop → main 푸시 → Supabase Site URL을 운영 도메인으로. 지금 운영은 9/17 Flutter 웹이고 `/api/parse-pdf`가 404라 **앱의 PDF 불러오기가 운영 주소 기준으로는 실패**한다. **그 전에는 main에 푸시 금지**
- **스토어 출시 준비**(순서 결정 대기: Android 먼저 권장): 계정 삭제 기능, 개인정보처리방침·이용약관(웹 `/privacy`·`/terms`), 이력서가 OpenAI로 전송된다는 국외 이전 고지, 업로드 키스토어, 앱 아이콘·스플래시 적용, 스토어 등록 자료, iOS는 Apple 로그인(가이드라인 4.8) 재도입 검토, Play 비공개 테스트 요건 확인
- **직접 확인할 것**: 자기소개 추출·시작 흐름, 이력서 화면 모양(앱), 히어로 애니메이션, 앱에서 깃허브·카카오 로그인, 새 분야·주제 카드 표시, 음성 입력(실기기)
- 회원 면접 대화를 새로고침 후 서버 기록에서 복원하는 기능 미구현. 홈 분야 카드의 주제 수/문제 수 표시, 문제 목록 필터·정렬 미구현. 앱 폰트(웹은 IBM Plex Sans KR) 미적용, 앱의 4MB 초과 PDF 사전 검사 없음
- **자기소개 AI 초안 만들기(2단계)**: 제목이 없는 이력서용, 하루 1회 제한 아이디어. 서버 함수와 한도 설계 필요(미착수)
- **콘텐츠**: 어드민에서 모범답안 검수(특히 Kafka·캐시 일관성·RabbitMQ), 성능·확장성(6문제) 보충, 임베딩 후 의미 중복 전수 검사(M5-b). 게시 스크립트는 레포가 아니라 임시 폴더(scratchpad)에 있다 — 다시 쓸 일이 있으면 레포로 옮길 것
- 어드민 웹앱이 Vercel에 배포돼 있지 않은 것으로 보임(프로젝트 목록에 없음) — 확인 필요
- **외부 콘솔(사용자 몫)**: OpenAI 결제 한도 설정, 카카오·구글 앱 이름·로고 정리(구글 로그인 화면의 `supabase.co` 문구는 브랜드 인증/커스텀 도메인 전에는 그대로)
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증, 어드민 콘텐츠 생성→앱 노출 E2E, M5-b(임베딩 키), `interview-chat` 회원 세션 completed 미전환
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
