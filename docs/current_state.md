# 현재 상태

마지막 갱신: 2026-09-29

## 완료
- M0~M5-a, M4 후속(Apple/Kakao 로그인 코드, 홈 카드 UI, LLM 키 연결, 콘텐츠 264문제) — 전부 `develop`에 머지 완료 (PR #22까지)
- **이번 세션(이슈 #24, 브랜치 `feat/24-nextjs-web`, PR #25 열림, CI 통과)**: 사용자용 웹을 Flutter 웹이 아닌 **Next.js(`webapp/`)로 전환**하기로 결정하고 구현. 계획: `docs/plans/nextjs-web.md`, ADR-019, 로드맵 새 M6(Next.js 웹 전환) / 기존 M6 폴리시 → M7
  - 구현: 문제풀이·오답노트·이력서·PDF Route Handler·모의면접(SSE)·OAuth 4종·로컬→DB 이전·회원 경로. Vitest 25개, lint/tsc/build 통과
  - Flutter 웹 반응형 작업(#23)은 폐기·이슈 닫음
  - Vercel: 기존 프로젝트 Root Directory를 `webapp`으로, 프리셋 Next.js, `NEXT_PUBLIC_SUPABASE_*` env 추가, `webapp/vercel.json` 추가. Preview에서 Next 앱 200 응답 확인
  - Supabase Redirect URLs에 localhost/Preview/Production 패턴 등록 (Site URL은 그대로)
  - designer 에이전트(`.claude/agents/designer.md`) 추가, 웹 UI를 상단 네비 + 푸터 웹사이트 구조로 재설계 (**아직 미커밋**)

## 예정
- **UI 재설계 결과 확인 후 결정**: 로컬(`cd webapp && npm run dev`)에서 직접 보고, 수정 요청 또는 `.claude/agents/designer.md`와 함께 PR #25에 커밋·푸시
- **PR #25 머지 전 실측**(사람 작업): Chrome / macOS Safari / iOS Safari / Android Chrome에서 면접 스트리밍이 점진적으로 표시되는지 (iOS Safari에서 멈추면 계획 Open Question 4), 4개 제공자 실로그인(Google/GitHub는 바로 가능), 비회원 데이터 로그인 시 이전(서버에 이력서 있는 계정 포함), PDF 4MB 이하/초과
- **컷오버**: 위 실측 후 develop → main 푸시 → 모바일 앱 PDF 업로드 확인 → Supabase Site URL을 Production 도메인으로 변경. **그 전에는 `main`에 푸시 금지**(푸시하면 Production이 Next로 바뀜)
- 회원 면접 대화를 새로고침 후 서버 기록에서 복원하는 기능 미구현(현재 Flutter처럼 로컬 저장만) — 넣을지 결정 필요
- 홈 분야 카드에 주제 수/문제 수 표시 미구현(분야별 추가 조회 필요), 문제 목록 필터·정렬 바 미구현
- Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, Flutter `web/`)는 컷오버 안정화 후 별도 PR
- **외부 콘솔 설정(사용자 몫)**: Supabase에서 Apple/Kakao provider가 현재 **비활성** — Apple Developer Services ID·.p8 키, Kakao Developers 설정, Supabase provider 활성화 및 "Allow users without an email", 기존 Google iOS OAuth 클라이언트를 새 번들 ID(`com.doxmt.devinterview`)로 재등록
- 이전 세션분 미완: 회원 경로 LLM 실호출 검증, 앱 아이콘 적용(시안만 있음), 어드민 콘텐츠 생성→앱 노출 E2E, M5-b(임베딩 키 필요), `interview-chat` 회원 세션 completed 미전환
- 모바일 딥링크 `com.doxmt.devinterview://login-callback`이 Supabase Redirect URLs 목록에 없음(등록 전 목록이 비어 있었음) — 모바일 로그인이 이 목록에 의존하는지 확인 필요

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Node 22, Next 16.3.6, Supabase CLI 2.104.0. Supabase ref `bmewpbkllmlikzqkxalw`. 웹 로컬 실행은 `cd webapp && npm run dev` (`webapp/.env.local` 필요, gitignore, 이름은 `.env.local.example`)
- **Vercel Root Directory를 바꿔도 루트 `vercel.json`은 계속 적용된다**(Flutter 빌드 명령이 새어 Preview 빌드 실패) → `webapp/vercel.json`으로 덮어씀. 이후 `develop`/브랜치 Preview는 Next만 빌드하고 Flutter 웹 Preview는 없다. Production은 `main` 푸시 전까지 기존 Flutter 배포 유지
- 웹 클라이언트는 `interview-chat`을 브라우저에서 직접 호출한다(Next 서버 경유 시 IP 한도 무력화). 웹 SSE 파서는 `getReader()` 루프(Safari 호환)
- Redirect URLs 변경 전 값: 목록 비어 있음, Site URL `http://localhost:3000`
- Supabase Management API 토큰은 macOS 키체인의 Supabase CLI 항목에서 사용자 승인을 받고 사용했다. 다시 필요하면 다시 승인을 받을 것
- 서브에이전트가 만든 UI·코드는 보고를 그대로 믿지 말고 lint/tsc/test/build와 변경 범위를 직접 재확인했다. 화면 스크린샷 확인은 사람이 직접 하는 것이 정확하다
- 명령에 stdin을 기다리는 명령(`cat > file` 등)을 실수로 섞으면 120초 멈춘다 — heredoc과 함께 쓸 때 주의
- 콘텐츠 문제는 서브에이전트 웹 검색 작성 → 독립 2차 검증 → 게시(어드민 웹앱에서 직접 추가)
- 번들 ID `com.doxmt.devinterview`, 딥링크 스킴 `com.doxmt.devinterview://login-callback`, GitHub 기본 브랜치 `develop` (Vercel Production 브랜치는 `main`)
