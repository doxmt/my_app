# 현재 상태

마지막 갱신: 2026-09-30

## 완료
- M0~M5-a, M4 후속(Apple/Kakao 로그인 코드, 홈 카드 UI, LLM 키 연결, 콘텐츠 264문제) — `develop` 머지 완료
- **Next.js 웹 전환(PR #25 머지)**: 사용자용 웹을 `webapp/`(Next 16)로 전환, 상단 네비·푸터 웹사이트 구조 UI. 계획 `docs/plans/nextjs-web.md`, ADR-019, 로드맵 새 M6/기존 M6→M7. Vercel Root Directory `webapp`, `webapp/vercel.json`, Supabase Redirect URLs 등록 완료
- **디자인 통일(PR #27, #29 머지)**: 웹·앱 흰 배경 + 블루 `#2563eb` 테마(ADR-020)
- **PR #31 머지 (이슈 #30)**: 웹·앱 화면 모드(라이트/다크, 기본 라이트, 웹은 헤더 토글), 이력서 PDF 한도 안내(4MB·20페이지), 모의면접·문제풀기 **음성 입력(마이크)**(ADR-021), Android 메인 매니페스트 `INTERNET` 권한 누락 버그 수정
- 열린 PR/이슈 없음. 현재 `develop` 기준

## 예정
- **음성 입력 실측(사람 작업, 미검증)**: 웹 Chrome에서 마이크 허용 후 실제로 말해 글자가 채워지는지, 앱 iOS·Android 실기기에서 권한 요청과 인식. iOS 빌드는 한 번도 하지 않음(`pod install` 포함). Android 릴리즈 빌드에서 네트워크가 되는지도 실기기 확인
- **화면 확인(사람 작업)**: 웹·앱 라이트/다크 전환 화면, 새 테마가 각 화면에서 어색하지 않은지(시뮬레이터/실기기 미확인)
- **웹 컷오버 전 실측**: Chrome / macOS Safari / iOS Safari / Android Chrome에서 면접 스트리밍 점진 표시(iOS Safari에서 멈추면 계획 Open Question 4), 4개 제공자 실로그인(Google/GitHub는 바로 가능), 비회원 데이터 로그인 시 이전(서버에 이력서 있는 계정 포함), PDF 4MB 이하/초과
- **컷오버**: 위 실측 후 develop → main 푸시 → 모바일 앱 PDF 업로드 확인 → Supabase Site URL을 Production 도메인으로 변경. **그 전에는 `main`에 푸시 금지**(푸시하면 Production이 미완성 Next로 바뀜)
- 회원 면접 대화를 새로고침 후 서버 기록에서 복원하는 기능 미구현(현재 Flutter처럼 로컬 저장만) — 넣을지 결정 필요
- 웹 홈 분야 카드의 주제 수/문제 수 표시, 문제 목록 필터·정렬 바 미구현. 앱은 폰트(웹은 IBM Plex Sans KR) 미적용, 화면 구성은 웹과 다름(테마만 통일). 앱은 4MB 초과 PDF를 업로드 전에 검사하지 않고 서버가 거절함
- Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, Flutter `web/`)는 컷오버 안정화 후 별도 PR
- **외부 콘솔 설정(사용자 몫)**: Supabase에서 Apple/Kakao provider가 현재 **비활성** — Apple Developer Services ID·.p8 키, Kakao Developers 설정, provider 활성화 및 "Allow users without an email", 기존 Google iOS OAuth 클라이언트를 새 번들 ID(`com.doxmt.devinterview`)로 재등록
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증, 앱 아이콘 적용(시안만 있음), 어드민 콘텐츠 생성→앱 노출 E2E, M5-b(임베딩 키 필요), `interview-chat` 회원 세션 completed 미전환
- 모바일 딥링크 `com.doxmt.devinterview://login-callback`이 Supabase Redirect URLs 목록에 없음(등록 전 목록이 비어 있었음) — 모바일 로그인이 이 목록에 의존하는지 확인 필요

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Node 22, Next 16.3.6, Supabase CLI 2.104.0. Supabase ref `bmewpbkllmlikzqkxalw`. 웹 로컬 실행 `cd webapp && npm run dev`(`webapp/.env.local` 필요, gitignore, 이름은 `.env.local.example`). 3000번 포트가 이미 쓰이면 3001번으로 뜸
- **Vercel Root Directory를 바꿔도 루트 `vercel.json`은 계속 적용된다** → `webapp/vercel.json`으로 덮어씀. 이후 `develop`/브랜치 Preview는 Next만 빌드하고 Flutter 웹 Preview는 없다. Production은 `main` 푸시 전까지 기존 Flutter 배포 유지
- 웹 클라이언트는 `interview-chat`을 브라우저에서 직접 호출한다(Next 서버 경유 시 IP 한도 무력화). 웹 SSE 파서는 `getReader()` 루프(Safari 호환)
- 색상: 웹 `webapp/app/globals.css`와 앱 `lib/app/theme.dart`가 같은 토큰(블루 `#2563eb`, 흰 배경, 모서리 8)을 따로 갖는다 — 한쪽을 바꾸면 다른 쪽도 맞출 것(ADR-020). 화면 모드는 웹·앱 모두 기본 라이트, 기기 설정 미추종, 기기별 저장
- 이력서 PDF 한도: Vercel 요청 본문 4.5MB 때문에 서버 상한이 4MB·20페이지. 그 이상은 Vercel Blob 직접 업로드 같은 다른 구조가 필요함(현재 안 함)
- 음성 입력: Chrome은 오디오를 구글 서버로, iOS는 애플 음성 서비스로 보낼 수 있어 개인정보 안내가 필요할 수 있음. 웹은 Firefox 미지원
- `dart format`을 기존 파일에 그대로 돌리면 이 프로젝트의 120자 줄을 80자로 재정렬해 diff가 커진다 → 새 파일에만 쓰고 기존 파일은 필요한 줄만 편집할 것
- 이슈의 `Closes #N` 자동 close가 #24 이후 동작하지 않아 머지 후 `gh issue close`로 수동 종료했다(원인 미확인)
- `.claude/agents/designer.md`(harness_framework에서 복사)는 방향 정의 성격이라 구현을 시킬 땐 프롬프트에 명시해야 한다
- Supabase Management API 토큰은 macOS 키체인의 Supabase CLI 항목을 사용자 승인을 받고 사용했다. 다시 필요하면 다시 승인받을 것. Redirect URLs 변경 전 값: 목록 비어 있음, Site URL `http://localhost:3000`
- 서브에이전트가 만든 코드·UI는 보고를 그대로 믿지 말고 lint/tsc/test/build와 변경 범위를 직접 재확인한다. 화면 확인은 사람이 직접 보는 것이 정확하다
- macOS에는 `timeout` 명령이 없다. `cat > file` 같은 stdin 대기 명령을 heredoc과 섞으면 120초 멈춘다. 임시 파일은 `/tmp`가 아니라 스크래치패드에 둘 것
- 콘텐츠 문제는 서브에이전트 웹 검색 작성 → 독립 2차 검증 → 게시(어드민 웹앱에서 직접 추가)
- 번들 ID `com.doxmt.devinterview`, 딥링크 스킴 `com.doxmt.devinterview://login-callback`, GitHub 기본 브랜치 `develop`(Vercel Production 브랜치는 `main`)
