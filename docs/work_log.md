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

## 2026-09-18
- `/plan`: M2(카테고리/문제풀이 + 로컬 오답노트) 인터뷰 → 1차 초안 → explore/document-specialist/writer 조사 → 최종 계획(`docs/plans/m2-practice-wrong-notes.md`) 작성
- 인터뷰로 확정: 학습하기+문제풀기 2갈래, CS·프론트엔드 2개 분야만 시드(주제2×문제3, 서술형만), 로컬 저장은 `SharedPreferencesAsync`+JSON, 답변 시도 기록은 저장 안 함(ADR-012)
- `prd.md`/`roadmap.md`/`overview.md`/`architecture.md`/`adr.md`/`open-questions.md` 갱신
- `/start`: 이슈 #6 생성, 브랜치 `feat/6-m2-practice-wrong-notes` 생성
- executor로 M2 구현: 시드 마이그레이션 적용, `features/practice`(학습하기/문제풀기 통합) + `features/wrong_notes` + `core/storage` 신규, 라우팅에 드릴다운 4단계(`context.push()`) 추가
- 구현 중 발견: postgrest Dart 클라이언트 `.order()`의 `ascending` 기본값이 `false`(SQL과 반대) — 기존 M1 코드(`SupabaseCategoryRepository`) 포함해 수정
- 검증: `flutter analyze` 무경고, `flutter test` 21개 통과, Chrome에서 전체 여정(문제풀이→오답노트 저장→재시작 후 유지→딥링크) 확인
- iOS 시뮬레이터(iPhone 17 Pro)에서 홈 화면·하단 탭까지 확인, 드릴다운 화면은 세션 종료로 미확인
- `/submit`: 커밋, 푸시, PR #7 생성 (`Closes #6`)
- 사용자 피드백: 홈의 분야 목록을 카드형(아이콘/이미지 포함)으로 바꾸고 싶다는 요청 — 아직 미반영, 처리 시점 미정

### 주요 변경 파일
- `supabase/migrations/20260918051938_seed_m2_content.sql`
- `lib/features/practice/` (신규 전체)
- `lib/features/wrong_notes/` (domain/data/presentation 신규·보강)
- `lib/core/storage/local_json_store.dart`
- `lib/app/router.dart`, `lib/features/categories/`
- `docs/plans/m2-practice-wrong-notes.md`

## 2026-09-18
- `/plan`으로 M3(이력서 입력 + 모의면접, 비회원) 계획 수립 — 인터뷰, explore/document-specialist 조사, writer의 docs 반영까지 완료
- PDF 함수 배치(같은 레포·같은 Vercel 프로젝트), `functions.invoke` 스트리밍 미지원 대응(http 직접 호출 + SSE 수동 파싱), mock LLM 어댑터 미도입 결정 → ADR-013
- `/start`로 이슈 #8 생성, `feat/8-이력서-모의면접` 브랜치에서 executor가 계획 6단계 전부 구현
  - PDF 파싱 Vercel 함수(`api/parse-pdf.ts`, unpdf) 배포 + Firewall rate-limit
  - `increment_guest_usage` RPC + `rate_limit_config` 초기값(임시값 device 10 / ip 40) 마이그레이션 적용
  - `interview-chat` Edge Function(Anthropic/OpenAI 어댑터, SSE 스트리밍, 사용량 조회 라우팅) 배포
  - 이력서 feature(`lib/features/resume`), 모의면접 채팅 UI(`lib/features/interview`) 구현
  - `flutter analyze` 0 issues, `flutter test` 35개 통과, Deno 테스트 9개 통과, 배포된 엔드포인트 curl로 실동작 검증
- 진행 중 발견/수정: `vercel.json` buildCommand 256자 제한 → `scripts/vercel-build.sh`로 분리, `.vercelignore` 누락으로 `build/`·`node_modules` 업로드 시도되던 것 수정, service_role GRANT 누락 마이그레이션 추가, `file_picker` 13.1.0 API 변경(정적 메서드로) 대응, 루트에 잘못 생성된 `deno.lock`·`node_modules` gitignore 처리
- `/submit`으로 커밋 3개(docs / 백엔드 / 프론트엔드)로 나눠 push, PR #9 생성(`Closes #8`, base develop)
- **미완료로 남김**: iOS 시뮬레이터에서 이력서 입력→PDF→분야 선택→메시지 전송→429/에러 상태→재시작 유지, 이 실제 화면 흐름을 직접 탭해서 확인하는 작업 — 이번 세션엔 GUI 자동화 권한 문제로 못 함, PR 본문에 명시해둠

### 주요 변경 파일
- `docs/plans/m3-resume-interview.md`, `docs/plans/open-questions.md`, `docs/adr.md`(ADR-013), `docs/architecture.md`, `docs/roadmap.md`, `docs/overview.md`
- `api/parse-pdf.ts`, `package.json`, `scripts/vercel-build.sh`, `.vercelignore`, `vercel.json`
- `supabase/migrations/20260918063747_guest_usage_rpc.sql`, `supabase/migrations/20260918064500_grant_service_role_guest_usage.sql`
- `supabase/functions/interview-chat/` (index.ts, `_shared/llm/*`, `_shared/prompt.ts`, `_shared/rate_limit.ts`)
- `lib/features/resume/`, `lib/features/interview/`, `lib/app/router.dart`, `lib/app/app_config.dart`, `lib/features/me/presentation/me_page.dart`
- `.gitignore`

## 2026-09-18
- `/plan`으로 M4(OAuth 회원가입) 계획 수립 — 인터뷰로 범위를 Google+GitHub(Apple/Kakao 제외), 오답노트+이력서만 이전(면접 대화 제외)으로 확정
- document-specialist 조사: Supabase의 Kakao 기본 지원 확인, `google_sign_in` 7.x breaking change, Supabase Redirect URL glob 패턴(Vercel Preview 대응)
- writer가 `docs/architecture.md`/`docs/roadmap.md`/`docs/adr.md`(ADR-014)/`docs/plans/open-questions.md` 갱신, `docs/plans/m4-oauth-signup.md` 작성
- `/start`로 이슈 #11 생성, 브랜치 `feat/11-oauth-signup` 생성
- explore(Flutter/Supabase 구조 조사) + architect(profiles 트리거·데이터 이전 위치·리포지토리 분기 설계 검토) 호출 — 계획에 없던 스키마 불일치(오답노트 로컬 모델이 DB 컬럼과 불일치, `Resume.sourceType`이 DB check 제약 위반, `resumes` 테이블에 `user_id` unique 없음) 발견 및 보완 지침 확정
- executor가 M4 1~5단계 전부 구현: `profiles` 자동 생성 트리거 + `increment_daily_usage` RPC + `free=12`/`guest_device=3` 한도 + `wrong_notes.resolved_at` 컬럼, Google(네이티브+웹 분기)/GitHub(리다이렉트) 로그인 화면, 리포지토리 회원 분기, 로그인 시 로컬 데이터(오답노트+이력서) 자동 이전, `interview-chat` 회원 경로(JWT 검증)
- `flutter analyze` 0 issues / `flutter test` 45 passed / `deno test` 14 passed, 원격 마이그레이션 적용 및 curl 종단 검증(429/DB 저장/비회원 회귀 없음) 완료 — 직접 검증함
- `/submit`으로 커밋(`605cb62`) 후 PR #12 생성 (`feat/11-oauth-signup` → `develop`, `Closes #11`)

### 주요 변경 파일
- `docs/plans/m4-oauth-signup.md`, `docs/adr.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/plans/open-questions.md`
- `supabase/migrations/20260918070000_m4_profiles_trigger_and_member_usage.sql`, `20260918080000_grant_service_role_member_interview.sql`, `20260918081500_grant_service_role_interview_messages_select.sql`
- `lib/features/auth/**` (신규)
- `lib/features/wrong_notes/data/supabase_wrong_note_repository.dart`, `lib/features/resume/data/supabase_resume_repository.dart` (신규)
- `supabase/functions/interview-chat/index.ts`, `_shared/member_auth.ts`(신규), `_shared/rate_limit.ts`
