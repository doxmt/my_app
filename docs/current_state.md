# 현재 상태

마지막 갱신: 2026-09-30

## 완료
- M0~M5-a, M4 후속(Apple/Kakao 로그인 코드, 홈 카드 UI, LLM 키 연결, 콘텐츠 264문제) — `develop` 머지 완료
- **PR #25 머지(2026-09-29~30)**: 사용자용 웹을 Next.js(`webapp/`)로 전환 + 상단 네비·푸터 웹사이트 구조 UI. 계획 `docs/plans/nextjs-web.md`, ADR-019, 로드맵 새 M6(Next.js 웹 전환)/기존 M6→M7. Vercel Root Directory `webapp`, `webapp/vercel.json`, Supabase Redirect URLs 등록 완료
- **PR #27 (열림, CI 통과, 미머지)**: 웹 배경 흰색 + 강조색 블루 `#2563eb`, 항상 라이트 (이슈 #26)
- **모바일 앱 테마 통일 (이슈 #28, 브랜치 `design/28-app-theme`, 미커밋·PR 없음)**: `lib/app/theme.dart`를 웹 토큰 기반으로 교체. `flutter analyze`/`flutter test` 통과, 시뮬레이터에서 직접 본 적 없음. 이 브랜치에는 세션 문서 갱신만 커밋됨

## 예정
- **`/submit`으로 #28 PR 올리기**(theme.dart 커밋) → 시뮬레이터/실기기에서 라이트·다크 화면 확인 → CI 확인 → `/finish`. PR #27도 `/finish`로 머지 필요(둘 다 develop 대상, 서로 파일이 달라 충돌 없음)
- **컷오버 전 실측(사람 작업)**: Chrome / macOS Safari / iOS Safari / Android Chrome에서 면접 스트리밍 점진 표시(iOS Safari에서 멈추면 계획 Open Question 4), 4개 제공자 실로그인(Google/GitHub는 바로 가능), 비회원 데이터 로그인 시 이전(서버에 이력서 있는 계정 포함), PDF 4MB 이하/초과
- **컷오버**: 위 실측 후 develop → main 푸시 → 모바일 앱 PDF 업로드 확인 → Supabase Site URL을 Production 도메인으로 변경. **그 전에는 `main`에 푸시 금지**(푸시하면 Production이 미완성 Next로 바뀜)
- 회원 면접 대화를 새로고침 후 서버 기록에서 복원하는 기능 미구현(현재 Flutter처럼 로컬 저장만) — 넣을지 결정 필요
- 웹 홈 분야 카드의 주제 수/문제 수 표시, 문제 목록 필터·정렬 바 미구현
- 앱 폰트(웹은 IBM Plex Sans KR) 미적용, 앱 화면 구성은 웹과 다름(테마만 통일) — 필요하면 별도 작업
- Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, Flutter `web/`)는 컷오버 안정화 후 별도 PR
- **외부 콘솔 설정(사용자 몫)**: Supabase에서 Apple/Kakao provider가 현재 **비활성** — Apple Developer Services ID·.p8 키, Kakao Developers 설정, provider 활성화 및 "Allow users without an email", 기존 Google iOS OAuth 클라이언트를 새 번들 ID(`com.doxmt.devinterview`)로 재등록
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증, 앱 아이콘 적용(시안만 있음), 어드민 콘텐츠 생성→앱 노출 E2E, M5-b(임베딩 키 필요), `interview-chat` 회원 세션 completed 미전환
- 모바일 딥링크 `com.doxmt.devinterview://login-callback`이 Supabase Redirect URLs 목록에 없음(등록 전 목록이 비어 있었음) — 모바일 로그인이 이 목록에 의존하는지 확인 필요

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Node 22, Next 16.3.6, Supabase CLI 2.104.0. Supabase ref `bmewpbkllmlikzqkxalw`. 웹 로컬 실행 `cd webapp && npm run dev`(`webapp/.env.local` 필요, gitignore, 이름은 `.env.local.example`)
- **Vercel Root Directory를 바꿔도 루트 `vercel.json`은 계속 적용된다** → `webapp/vercel.json`으로 덮어씀. 이후 `develop`/브랜치 Preview는 Next만 빌드하고 Flutter 웹 Preview는 없다. Production은 `main` 푸시 전까지 기존 Flutter 배포 유지
- 웹 클라이언트는 `interview-chat`을 브라우저에서 직접 호출한다(Next 서버 경유 시 IP 한도 무력화). 웹 SSE 파서는 `getReader()` 루프(Safari 호환)
- 색상: 웹 `webapp/app/globals.css`와 앱 `lib/app/theme.dart`가 같은 토큰(블루 `#2563eb`, 흰 배경, 모서리 8)을 따로 갖는다 — 한쪽을 바꾸면 다른 쪽도 맞출 것(ADR-020). 웹은 항상 라이트, 앱은 시스템 다크 추종
- `.claude/agents/designer.md`가 추가됨(harness_framework에서 복사, 방향 정의 성격이라 구현을 시킬 땐 프롬프트에 명시해야 함). 새 에이전트는 세션 재시작 후 보이는 경우가 있음
- Supabase Management API 토큰은 macOS 키체인의 Supabase CLI 항목을 사용자 승인을 받고 사용했다. 다시 필요하면 다시 승인받을 것. Redirect URLs 변경 전 값: 목록 비어 있음, Site URL `http://localhost:3000`
- 서브에이전트가 만든 코드·UI는 보고를 그대로 믿지 말고 lint/tsc/test/build와 변경 범위를 직접 재확인한다. 화면 확인은 사람이 직접 보는 것이 정확하다
- macOS에는 `timeout` 명령이 없다. `cat > file` 같은 stdin 대기 명령을 heredoc과 섞으면 120초 멈춘다
- 콘텐츠 문제는 서브에이전트 웹 검색 작성 → 독립 2차 검증 → 게시(어드민 웹앱에서 직접 추가)
- 번들 ID `com.doxmt.devinterview`, 딥링크 스킴 `com.doxmt.devinterview://login-callback`, GitHub 기본 브랜치 `develop`(Vercel Production 브랜치는 `main`)
