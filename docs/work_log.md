# 작업 로그

## 2026-09-17
- Flutter 프로젝트 생성, 웹 빌드 오류(Gatekeeper 격리, dart-sdk 캐시 누락) 해결
- GitHub 비공개 레포 생성, `develop` 브랜치 전략 적용
- Claude Code 하네스 적용 및 트리밍 (analyst, test-engineer, 훅, 코드리뷰 커맨드 제외)
- Vercel 연결 + `vercel.json` 커스텀 빌드, GitHub Actions CI 추가
- 전체 제품 설계 확정 (Supabase, Riverpod, go_router, LLM 어댑터, 로그인 없는 비회원 + 기기 ID/IP 한도, 콘텐츠 파이프라인)
- M0: 안 쓰는 데스크톱 플랫폼 폴더 삭제, 프로젝트 문서 작성

### 주요 변경 파일
- `CLAUDE.md`
- `docs/prd.md`, `docs/architecture.md`, `docs/adr.md`, `docs/roadmap.md`, `docs/current_state.md`
- `vercel.json`, `.github/workflows/ci.yml`
- `macos/`, `linux/`, `windows/` (삭제)

## 2026-09-17
- M1 계획 수립 (`/plan`): 마이그레이션 범위(RPC는 M3/M4), Material 3 시드 테마, dart-define 키 주입, 원격 DB 검증, path URL + Vercel rewrite 확정 (ADR-009)
- 앱 구조 스케치(Artifact Design 캔버스) 작성 후 하단 탭 3개(홈/모의면접/내 정보) + 모바일 우선 확정 (ADR-010)
- M1 구현 및 머지 (PR #2, 이슈 #1): Supabase init + 12개 테이블/RLS/GRANT/pgvector 마이그레이션 원격 적용, 앱 부트스트랩, 기기 ID, categories 3계층, 하단 탭 셸, 테스트 9개
- 검증: analyze/test 통과, iOS 시뮬레이터 확인, 웹 빌드·Vercel Preview 딥링크 200, 권한 없는 테이블 거부(42501), 익명 로그인 꺼짐 확인. Android는 에뮬레이터 없어 미확인
- Vercel 환경변수(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) Preview/Production 등록, Vercel CLI 59.20.0 업데이트
- PR 한글 요약 댓글 추가 및 머지 (PR #4, 이슈 #3): CI·Vercel 배포 결과를 표 형식 댓글 하나로 갱신
- Vercel PR/커밋 댓글 끔, GitHub 기본 브랜치를 develop으로 변경(develop 머지에서도 `Closes #N` 자동 닫힘), PR 설명의 Claude Code 문구 제거(`.claude/settings.json`)
- CLAUDE.md Do Not에 "current_state/work_log는 /wrap에서만 작성" 추가
- 세션 마무리 순서를 `/submit` → `/wrap` → `/finish`로 정하고 `/wrap`에 커밋·push 단계 추가 (기능 브랜치가 없으면 `docs/wrap-날짜` PR)

### 주요 변경 파일
- `supabase/config.toml`, `supabase/migrations/20260917082153_init_schema.sql`
- `lib/main.dart`, `lib/app/`, `lib/core/`, `lib/features/`
- `test/widget_test.dart`, `test/core/`, `test/features/`
- `pubspec.yaml`, `vercel.json`, `.gitignore`, `env/dev.json.example`
- `.github/workflows/ci.yml`, `.github/workflows/pr-deploy.yml`, `.github/scripts/pr-summary.js`
- `.claude/settings.json`, `.claude/skills/github/SKILL.md`, `.claude/commands/wrap.md`, `CLAUDE.md`
- `docs/plans/m1-supabase-skeleton.md`, `docs/plans/open-questions.md`, `docs/adr.md`, `docs/architecture.md`, `docs/overview.md`, `docs/prd.md`, `docs/roadmap.md`
