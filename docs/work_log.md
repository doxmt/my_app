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

## 2026-09-20
- `/plan`으로 M5-a(어드민 웹앱 + 콘텐츠 관리) 계획 수립 — 인터뷰로 로그인 방식(고정 계정+비밀번호 전용 화면), M5-a/M5-b 분할(API 키 미확보), 프레임워크(Vite+React+TS), 배포 위치(같은 레포 admin/ + 별도 Vercel 프로젝트) 확정. explore/document-specialist 조사 반영해 계획 확정
- `/start`로 이슈 #13 생성, `feat/13-admin-console` 브랜치 시작, executor가 M5-a 1~5단계 전체 구현
- 어드민 웹앱(admin/, Vite+React+TS+Tailwind v4+shadcn/ui) 신규: 비밀번호 전용 로그인, 카테고리 관리, 공유 문제 에디터(직접 작성/후보 승인/반려), 문제 목록(게시 토글)
- `categories`/`questions` 어드민 쓰기·미게시 조회 RLS+GRANT, `approve_question_candidate` RPC(SECURITY DEFINER) 추가 및 원격 적용, anon 키로 거부 확인
- CI에 admin lint+build 스텝 추가
- 로그인 화면(M4, `login_page.dart`) 버튼 정렬 버그 발견 → 별도 이슈 #14 + `fix/14-login-align` 브랜치로 분리해 로컬 커밋(M5-a와 무관해 PR #15에는 미포함, 아직 push/PR 안 함)
- `/submit`으로 PR #15 생성 (`feat/13-admin-console` → `develop`, `Closes #13`)
- 문서 갱신: `docs/prd.md`, `docs/overview.md`, `docs/roadmap.md`(M5 → M5-a/M5-b 분할), `docs/adr.md`(ADR-016, ADR-017), `docs/architecture.md`(어드민 스택·권한·데이터 흐름 갱신), `docs/plans/m5a-admin-console.md`(신규), `docs/plans/open-questions.md`

### 주요 변경 파일
- `admin/` (신규 Vite+React+TS 어드민 앱 전체)
- `supabase/migrations/20260920090000_m5a_admin_content_permissions.sql`
- `.github/workflows/ci.yml`
- `docs/prd.md`, `docs/overview.md`, `docs/roadmap.md`, `docs/adr.md`, `docs/architecture.md`
- `docs/plans/m5a-admin-console.md`, `docs/plans/open-questions.md`
- `lib/features/auth/presentation/login_page.dart` (별도 브랜치 `fix/14-login-align`, PR #15에는 미포함)

## 2026-09-28
- `/plan`으로 Apple/Kakao 로그인 + 홈 카드 UI + LLM 키 연결 계획 수립 (ADR-018, roadmap/architecture/prd/overview 갱신)
- `/start`로 이슈 #21 생성, `feat/21-apple-kakao-login-home-ui` 브랜치 시작
- 번들 ID `com.doxmt.devinterview`, 앱 표시명 `DevInterview`로 교체, 딥링크 스킴 등록, 로그인 화면 provider 버튼 구조 정리
- Apple 로그인(iOS 네이티브 `sign_in_with_apple` + nonce, Web/Android `signInWithOAuth`) + Kakao 로그인(`signInWithOAuth`, 이메일 없이 가입 허용) 구현
- 4개 로그인 버튼(Google/Apple/Kakao/GitHub)을 각 사 공식 브랜드 가이드에 맞게 재구현 — 공식 로고 에셋 확보(Google G, Kakao 심볼은 공식 PSD 벡터 레이어 추출, GitHub Invertocat), `assets/login/README.md`에 출처·규정 기록, 버튼 크기·글자·문구 통일
- 홈 분야 카드 UI(`category_icons.dart`, `slug → IconData` 매핑, DB 변경 없음) + 학습하기/문제풀기 선택 화면·주제 목록 화면도 카드 UI로 통일, 카드 오버플로 버그 수정
- 문제풀기 UX 개선: 주제 선택 시 목록 없이 랜덤 문제로 바로 진입, 분야 전체 랜덤 카드 추가
- 콘텐츠 대량 확충: 모바일·인프라/DevOps 신규 분야(14주제 140문제), 프론트엔드 7주제(70문제: React/TypeScript/웹 성능·접근성/Next.js/CSS 레이아웃/빌드 도구/라이브러리), AI 3주제(30문제) — 전부 서브에이전트로 조사 작성 → 독립 2차 사실검증 → 중복 확인 후 게시. 전체 문제 24개 → 264개로 증가
- LLM 키 연결: OpenAI 키 발급·`supabase secrets set`로 등록(`LLM_PROVIDER=openai`, `OPENAI_API_KEY`), `interview-chat`의 빈 `catch {}` 4곳에 에러 로깅 추가 후 재배포 — OpenAI 크레딧 소진 문제를 로그로 진단, 크레딧 충전 후 실제 SSE 스트리밍 성공 확인(curl 기준, 비회원 경로)
- 앱 아이콘 시안(말풍선 + `</>`, SVG/PNG) 제작 — 아직 앱에 미적용, 승인 대기
- `rate_limit_config` 확인: guest_device 3회, guest_ip 40회, free(회원) 12회/일

### 주요 변경 파일
- `ios/Runner.xcodeproj/project.pbxproj`, `ios/Runner/Info.plist`, `ios/Runner/Runner.entitlements`
- `android/app/build.gradle.kts`, `android/app/src/main/AndroidManifest.xml`, `android/app/src/main/kotlin/com/doxmt/devinterview/MainActivity.kt`
- `web/index.html`, `web/manifest.json`
- `lib/features/auth/data/apple_auth_client.dart`, `lib/features/auth/data/auth_actions.dart`, `lib/features/auth/presentation/login_buttons.dart`, `lib/features/auth/presentation/login_page.dart`, `lib/features/auth/presentation/auth_providers.dart`, `lib/features/me/presentation/me_page.dart`
- `assets/login/` (google_g.png, kakao_symbol.png/svg, github_invertocat_*.png, README.md)
- `lib/features/categories/presentation/category_icons.dart`, `categories_page.dart`
- `lib/features/practice/presentation/field_page.dart`, `topic_list_page.dart`, `question_list_page.dart`
- `supabase/functions/interview-chat/index.ts` (에러 로깅 추가)
- `docs/plans/oauth-apple-kakao-home-ui-llm.md`, `docs/plans/open-questions.md`, `docs/adr.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/prd.md`, `docs/overview.md`

## 2026-09-29
- Flutter 웹 반응형 작업(#23: AppShell NavigationRail 분기)을 진행하다가, 사용자용 웹은 원래 React/Next로 만들 계획이었다는 방향 확인 → 커밋 전에 전부 폐기하고 #23 닫음
- 사용자용 웹을 Next.js로 전환하는 계획 수립(`docs/plans/nextjs-web.md`): planner 인터뷰 + explore(코드베이스) + document-specialist(Next 16/Supabase SSR/Vercel/Safari SSE) 조사. 확정: 전 기능 동등 후 한 번에 전환, 새 M6(기존 M6 폴리시→M7), Vercel은 A안(기존 프로젝트 Root Directory → `webapp/`)
- 이슈 #24 / 브랜치 `feat/24-nextjs-web` / PR #25: `webapp/` 신규(Next 16.3.6, Tailwind v4, shadcn/ui, Vitest 25개). 문제풀이·오답노트·이력서·PDF Route Handler·모의면접(SSE, 브라우저에서 Edge Function 직접 호출)·OAuth 4종·로컬→DB 이전·회원 경로 구현. CI에 `webapp` 잡 추가, ADR-019, 로드맵(새 M6/M7), 문서 갱신
- Vercel 설정 변경(CLI/API): Root Directory `webapp`, 프리셋 Next.js, `NEXT_PUBLIC_SUPABASE_URL`/`PUBLISHABLE_KEY` 추가(Preview/Production). Root Directory를 바꿔도 루트 `vercel.json`이 적용되어 Preview 빌드가 실패 → `webapp/vercel.json`으로 덮어써 해결, 문서 정정
- Supabase Redirect URLs 등록(Management API, 키체인 CLI 토큰 사용 승인 후): localhost:3000, `my-*-songtaehas-projects.vercel.app`, `myapp-git-*-…`, `myapp-teal-mu.vercel.app`. Site URL은 그대로. 변경 전 값은 Redirect URLs 비어 있음 / Site URL `http://localhost:3000`
- `harness_framework`에서 designer 에이전트를 `.claude/agents/designer.md`로 복사, designer로 웹 UI를 PC 기준으로 리팩토링(1차 색·레이아웃 → 2차 상단 네비 + 푸터 웹사이트 구조로 재설계). 미커밋 상태
- 실수 기록: 명령에 stray `cat > /tmp/x`를 넣어 멈춤(종료·임시 파일 삭제, 영향 없음)

### 주요 변경 파일
- `webapp/` 전체(신규), `webapp/vercel.json`, `.github/workflows/ci.yml`
- `docs/plans/nextjs-web.md`, `docs/plans/web-responsive-layout.md`(대체됨 표기), `docs/plans/open-questions.md`
- `docs/adr.md`(ADR-019), `docs/roadmap.md`, `docs/architecture.md`, `docs/overview.md`, `CLAUDE.md`
- (미커밋) `webapp/components/**` UI 재설계, `webapp/app/globals.css`, `webapp/app/layout.tsx`, `.claude/agents/designer.md`

## 2026-09-30
- PR #25(Next.js 웹 전환 + UI 웹사이트 구조 재설계) CI 통과 확인 후 squash merge, 이슈 #24 닫힘, develop 동기화 (`7adf84a`)
- 웹 색상 변경(이슈 #26, PR #27 열림·CI 통과): 배경 흰색 `#ffffff`, 강조색 녹색 → 블루 `#2563eb`(사용자가 "녹색 대신 괜찮은 색" 요청으로 선택), 중립색 회색 톤. OS 다크 모드 자동 추종을 끄고 항상 라이트(`.dark` 클래스 수동 지원 유지). 로그인 소셜 버튼 색은 변경 없음
- 모바일 앱 테마를 웹과 통일(이슈 #28, 브랜치 `design/28-app-theme`): `lib/app/theme.dart`를 시드 기반 녹색에서 웹 토큰 기반 명시적 `ColorScheme`(라이트 흰 배경 + 블루, 다크는 시스템 따라감)으로 교체하고 카드·입력·버튼·앱바·하단 탭의 모서리 8dp/테두리/틴트 제거를 웹에 맞춤. 화면 구성·폰트는 변경 없음. `flutter analyze`/`flutter test`(63개) 통과, 시뮬레이터 확인은 아직. **미커밋**
- 모바일 팔레트 값은 임시 테스트로 `ColorScheme.fromSeed`를 덤프해 얻은 뒤 테스트 파일 삭제

### 주요 변경 파일
- `webapp/app/globals.css` (PR #27)
- `lib/app/theme.dart` (미커밋, 브랜치 `design/28-app-theme`)
- `docs/work_log.md`, `docs/current_state.md`, `docs/adr.md`(ADR-020)

## 2026-09-30 (이어서)
- 웹·앱 화면 모드(라이트/다크) 설정 구현 — 처음에는 "기본 시스템 + 라이트/다크 선택"이었다가 사용자 요청으로 웹은 헤더 토글 추가, 웹·앱 모두 "기본 라이트(기기 설정 미추종)"로 변경. 웹은 `localStorage` `theme` + `dark` 클래스(첫 페인트 전 인라인 스크립트), 앱은 `SharedPreferences` `theme_mode`. ADR-020을 최종 정책으로 정리
- 이력서 PDF 한도 조사(4MB·20페이지, Vercel 요청 본문 4.5MB 한도라 5MB 불가) 후 웹·앱 이력서 화면에 안내 문구 추가
- 웹 개발 모드 hydration 경고는 브라우저 확장이 `<body>`에 붙이는 속성이 원인이라 `<body suppressHydrationWarning>` 처리
- 모의면접·문제풀기 음성 입력(마이크) 구현: 웹 Web Speech API(`webapp/components/mic-button.tsx`, `lib/speech.ts`), 앱 `speech_to_text`(`lib/core/speech/`), iOS 마이크·음성 인식 사용 설명, Android `RECORD_AUDIO`·`queries`. 입력창에 채우고 직접 전송(ADR-021). Android 디버그 빌드 성공(병합 매니페스트 확인), 실제 말하기·iOS 빌드는 미검증
- **버그 발견·수정**: Android 메인 매니페스트에 `INTERNET` 권한이 없어(debug/profile에만 있음) 릴리즈 빌드에서 네트워크가 막힐 수 있던 문제를 보정
- 이슈 #30 / PR #31(CI 통과 후 사용자 요청으로 자동 머지) 머지, #26·#28·#30은 자동 close가 동작하지 않아 수동으로 닫음. PR #27(웹 색상)·#29(앱 테마)도 머지
- 실수 기록: 기다리는 명령에서 출력을 `/tmp`에 남김(바로 삭제), `dart format`이 기존 코드를 80자로 재정렬해 되돌림(프로젝트는 120자 줄 사용)

### 주요 변경 파일
- `webapp/lib/theme.ts`, `theme-client.ts`, `webapp/components/theme-*.tsx`, `mic-button.tsx`, `webapp/lib/speech.ts`, `webapp/app/layout.tsx`
- `lib/core/theme/theme_mode_provider.dart`, `lib/core/speech/`, `lib/main.dart`, `lib/features/me/presentation/me_page.dart`, `lib/features/interview/presentation/interview_page.dart`, `lib/features/practice/presentation/question_detail_page.dart`, `lib/features/resume/presentation/resume_page.dart`
- `android/app/src/main/AndroidManifest.xml`, `ios/Runner/Info.plist`, `pubspec.yaml`, `pubspec.lock`
- `docs/adr.md`(ADR-020 정리, ADR-021), `docs/architecture.md`, `docs/work_log.md`, `docs/current_state.md`

## 2026-10-01
- PR #34(브랜치 `feat/33-resume-return-to-interview`, 이슈 #33)로 한꺼번에 올림. 최초 푸시 시 CI(test·webapp·admin·Vercel) 통과 확인, 이후 푸시마다 재실행
- **면접 흐름**: 면접에서 "이력서 입력하기"로 가서 저장하면 면접으로 복귀(앱 `?from=interview`, 웹 `?next=/interview`). 음성 입력 중 표시 강화(빨간 버튼·파동·"듣는 중…"·입력창 강조, 앱 진동은 제외)
- **면접 시작 개편(ADR-023)**: 분야 선택 제거 → 지원 직무 + 선택 채용공고(3000자). `interview-chat` Edge Function 수정·재배포(`categoryName` 선택값, `jobPosting` 반영, Deno 테스트 19개). 실제 호출 1회로 채용공고가 질문에 반영되는 것 확인
- **자기소개 기능(ADR-023)**: 이력서에 자기소개 저장·추출·"자기소개로 시작하기"(앱·웹). `resumes.self_introduction` 컬럼 마이그레이션을 원격에 적용(`supabase db push`). 원격에만 있던 `20260920110000_seed_backend_ai_content`는 자리표시 빈 파일로 기록을 맞춤. 추출이 `업무 경험` 이후까지 가져오는 버그 수정(띄어쓰기 무시, 섹션명 126개, 날짜 줄 경계, 흔한 한 단어는 빈 줄/장식 있을 때만)
- **로그인(ADR-022)**: 카카오·구글·깃허브 3개로 축소, 애플 코드·의존성·iOS 권한 제거. Supabase에서 GitHub·Google·Kakao provider를 켬(Management API, 시크릿은 가려진 입력 창). 깃허브는 웹에서 동작 확인(어드민 계정에 합쳐짐), 카카오는 웹에서 동작 확인(별도 일반 계정). **구글은 계정 선택 화면까지만 확인했고 로그인 완료는 서버 기록상 없음**(앞서 "확인됐다"고 한 것은 실수). 깃허브 Client ID 첫 글자(`O`) 누락을 디바이스 코드 응답으로 찾아 수정. 카카오 `KOE004/205/006`을 차례로 해결(활성화, 세 동의항목, 플랫폼 키의 리다이렉트 URI). Supabase 리다이렉트 허용 목록에 localhost 3000·3001, Preview 패턴, 운영 도메인, 모바일 딥링크 추가
- **브랜딩**: 로고 에셋(`assets/brand/`: 120·128 정사각형·512·1024), 구글 동의 화면 이름·로고, 카카오 앱 아이콘용 128px. 웹 SEO·OpenGraph 메타데이터, 파비콘·앱 아이콘, 헤더 로고를 이미지로 교체(다른 세션 변경 포함)
- **히어로 애니메이션(웹)**: practice.md 카드에서 질문 타이핑 → 01·02·03 단계가 차례로 켜지고 유지 → 마지막에 일괄 초기화. 모션 감소 설정이면 정적 화면
- **콘텐츠**: 백엔드 주제 2→9개(81문제), 모바일 주제 5→14개(137문제), 전체 게시 문제 360→548개. 작성(서브에이전트 4, 공식 문서 대조) → 독립 검증(별도 에이전트 4, 사실 오류 다수 수정·12문항 drop) → `publish_content.py`로 형식·중복 검사 → DB 직접 게시. 검증 에이전트 4개가 사용량 한도로 한 번 중단돼 재시작. AI/ML·모델 분야 재분류와 ML 아이콘 매핑은 다른 세션에서 처리(`20261001000000_reclassify_llm_rag_under_ml.sql`, 원격 적용됨)
- **분석(문서화만)**: 모의면접 호출 비용(`gpt-4.1-mini` $0.40/$1.60, 메시지 1회 평균 약 4.6원, 면접 1회 약 70원). 구독 손익분기: 서비스 구독료(Supabase Pro+Vercel Pro 월 약 63,000원)만 기준으로 9,900원·월 300회면 구독자 8명, 수수료·부가세 반영 시 11~12명. 출시 준비 항목 정리(계정 삭제, 개인정보처리방침·국외 이전 고지, 애플 로그인 정책 4.8, 운영/개발 환경 분리, 구글 앱 인증, 도메인)
- **Vercel 상태 확인**: 운영(Production)은 9/17 Flutter 웹 그대로(`main` 마지막 커밋 9/17). 운영에 PDF 함수가 없어 `/api/parse-pdf`가 404이고 앱의 `PDF_PARSE_BASE_URL`이 운영 도메인을 가리킴. 어드민 Vercel 프로젝트는 찾지 못함
- **실수 기록**: 구글 로그인 완료를 서버 기록 확인 없이 단정함, 서브에이전트 보고를 그대로 믿지 않고 재검증해야 한다는 교훈 재확인(깃허브 ID 누락, 추출기 경계), `dart format`이 기존 줄을 80자로 재정렬, 파이썬 `urllib` 인증서 오류(`curl` 사용), 대기 명령에서 `/tmp` 사용

### 주요 변경 파일
- 면접·자기소개: `lib/features/interview/**`, `lib/features/resume/**`(`self_intro_extractor.dart`), `webapp/components/views/interview-view.tsx`·`resume-view.tsx`, `webapp/lib/resume/self-intro.ts`, `supabase/functions/interview-chat/**`
- 로그인: `lib/features/auth/**`, `webapp/components/views/login-view.tsx`, `pubspec.yaml`, `ios/Runner/Runner.entitlements`
- 마이그레이션: `supabase/migrations/20260930090000_resumes_self_introduction.sql`, `20260920110000_seed_backend_ai_content.sql`(자리표시), `20261001000000_reclassify_llm_rag_under_ml.sql`
- 웹: `webapp/components/practice-demo.tsx`, `webapp/app/layout.tsx`·`icon.png`·`apple-icon.png`·`favicon.ico`, `assets/brand/`
- 문서: `docs/adr.md`(ADR-022·023), `docs/architecture.md`, `docs/prd.md`, `docs/overview.md`, `docs/roadmap.md`

## 2026-10-06
- `/plan 앱 출시 준비하자`: 인터뷰로 범위 확정 — **iOS 우선 출시 + 웹 컷오버**, Apple 로그인 iOS 앱 전용 재도입, 계정 삭제는 앱·웹 즉시 삭제, 방침·약관은 자료조사 후 초안을 사용자 검토, 구글 로그인은 첫 출시 제외, 품질 우선·일정 유동. planner 초안 → explore(코드 사실)·document-specialist(개인정보보호법 제28조의8·제30조, App Store 4.8·5.1.1(v)·5.1.2(i), Apple 토큰 철회, Supabase Apple provider, 제출 요건, OpenAI·Supabase·Vercel 처리 국가, speech_to_text) 조사를 반영해 `docs/plans/ios-release-cutover.md`와 `open-questions.md` 생성
- 사용자에게 설명한 것: 컷오버의 의미(운영 Flutter 웹 → Next 웹 교체), 이력서가 OpenAI로 전송되는 이유와 국외 이전 고지 필요성
- `/start`로 이슈 #37(방침·약관 페이지, 설정 화면, 동의 화면) 구현 지시. 설정은 내 정보 탭 상단 톱니바퀴 → `/me/settings`(사용자 제안). Supabase 리전을 `get_project`로 확인(`ap-northeast-1`). executor 결과를 직접 재검증(flutter analyze/test, webapp lint/tsc/test/build 통과). 이 PR은 이후 #38로 10/4 머지됨(이 세션에서 제출하지 않았음 — 다른 세션이 진행)
- 사용자 요청으로 **학습하기 랜덤 학습** 추가(이슈 #62, 앱·웹 모두, 별도 브랜치). 범위: 학습하기 주제 목록 "전체 랜덤" 카드 + 문제 목록 "랜덤 문제" 버튼 + 상세 "다음 랜덤 문제" 버튼. executor를 격리 worktree에서 실행, 직접 재검증(flutter test 179, webapp test 99, build 통과). 화면 확인은 못 함. 아직 커밋·PR 전
- **실수 기록**: ① 로컬 문서를 근거로 "#37은 검토·`/submit` 대기 중"이라고 안내했으나 실제로는 이미 #38로 머지돼 있었다(`git fetch`로 원격 확인 안 함) ② explore 결과의 근거 없는 서술을 걸러내 재확인했으나 처음 보고에서 일부를 그대로 요약했다 ③ worktree가 main 기준으로 생성된 것을 executor가 발견해 develop으로 옮김

### 주요 변경 파일
- `docs/plans/ios-release-cutover.md`, `docs/plans/open-questions.md`(계획 단계)
- #62: `lib/features/practice/domain/random_pick.dart`, `lib/features/practice/presentation/{topic_list_page,question_list_page,question_detail_page}.dart`, `lib/app/router.dart`, `webapp/lib/random-pick.ts`, `webapp/components/views/{topic-list-view,question-list-view,question-detail-view}.tsx`, `webapp/app/categories/[field]/[mode]/[topic]/[questionId]/page.tsx`, 관련 테스트
- `docs/work_log.md`, `docs/current_state.md`

## 2026-10-08
(이 세션: 10/3~10/8, iOS 출시 준비. 사용자가 "너가 다 해줘"로 위임해 PR 20개를 올려 머지했다)
- 방침·약관 페이지·설정 화면·OpenAI 전송 동의 화면(#38), 방침의 위탁업체 연락처 채움(OpenAI는 원문이 403이라 검색 결과로 확인), 운영자 표기를 개인 개발자 기준으로 변경하고 이름·이메일 기재(#57)
- 계정 삭제 `delete-account` 함수 + 앱·웹 버튼(#40), 원격 배포·무인증 401·FK cascade 확인. Apple 토큰 철회(#48): .p8로 ES256 client_secret 생성 → 코드 교환 → 철회, 실패하면 삭제하지 않음
- Apple 로그인 iOS 전용 재도입(#42), iOS 출시 자산: AppIcon·LaunchImage 로고 교체, `PrivacyInfo.xcprivacy`, `ITSAppUsesNonExemptEncryption`(#44), 구글 버튼 숨김(#46, 이후 다른 세션이 10/7에 복원)
- CI에 Deno 테스트 잡(#50), 앱 4MB 초과 PDF 사전 차단(#51), 비회원 카운터 30일 후 삭제 pg_cron(#52), 회원 새 면접 시 이전 세션 completed(#53, 기존엔 예전 대화가 새 면접에 섞이는 버그), 웹 404·오류 화면(#54), 난이도 필터(#55), DB advisor 보강(#58), 패키지 소폭 업데이트·Android 아이콘(#59), 홈 분야 카드 주제·문제 수(#60), App Store 등록 자료 초안(#61), 설계 문서 반영 ADR-025~027(#49·#56)
- 운영 DB·함수 변경: 마이그레이션 3개 원격 적용(`20261004000000` 카운터 삭제, `20261004010000` service_role 세션 update, `20261004020000` advisor 보강), `interview-chat`·`delete-account` 재배포. 세션 update 권한 적용 전에 `interview-chat`을 먼저 배포해 몇 분간 회원의 새 면접이 실패할 수 있었다(바로 권한 적용)
- Supabase: Apple provider 켬(Client ID 번들 ID), secrets `APPLE_TEAM_ID`·`APPLE_CLIENT_ID`(10/4)·`APPLE_KEY_ID`(`6SR3YFD68P`)·`APPLE_PRIVATE_KEY`(10/8) 등록. Apple 서버가 이 키의 서명을 받아들이는 것을 가짜 코드로 확인(`invalid_grant`만 돌아옴)
- 사용자가 Apple Developer에서 App ID의 Sign in with Apple과 키(.p8)를 발급. iPhone 개발자 모드 활성화 후 실기기에 개발용 빌드 설치
- 실기기 카카오 로그인이 Safari `localhost`로 빠지는 문제: 원인은 로컬 `env/dev.json`에 `AUTH_REDIRECT_URL`이 없어 Supabase가 Site URL(`http://localhost:3000`)로 돌려보낸 것. 값 추가 후 재설치(재시도 결과는 미확인)
- 검증: 매 PR마다 flutter analyze·test, webapp lint·tsc·test·build, Deno 테스트 통과 후 CI 통과 확인하고 머지. 화면은 실기기·브라우저에서 직접 확인하지 못했다(홈 카드, 난이도 필터, 404·오류 화면, 설정·계정 삭제 화면)

### 주요 변경 파일
- supabase/functions/delete-account/(handler.ts, apple_revoke.ts, index.ts, 테스트), supabase/functions/interview-chat/(index.ts, _shared/prompt.ts)
- supabase/migrations/20261004000000_purge_guest_daily_usage.sql, 20261004010000_grant_service_role_interview_sessions_update.sql, 20261004020000_advisor_hardening.sql
- lib/features/auth/(apple_auth_client.dart, auth_actions.dart, login_buttons.dart, login_page.dart), lib/features/me/presentation/settings_page.dart, lib/core/(consent, legal)
- webapp/components/views/(privacy-view.tsx, terms-view.tsx, me-view.tsx, home-view.tsx, question-list-view.tsx), webapp/app/(privacy, terms, not-found.tsx, error.tsx)
- ios/Runner/(PrivacyInfo.xcprivacy, Info.plist, Runner.entitlements, Assets.xcassets), .github/workflows/ci.yml, docs/(adr.md, architecture.md, roadmap.md, prd.md, plans/app-store-listing.md)

## 2026-10-08 (오후: 컷오버·iOS 심사 제출)
(앞선 2026-10-08 기록 이후의 작업. 사용자가 "너가 다 해줘"로 위임하고 직접 콘솔·실기기 확인을 했다)
- Apple 쪽 마무리: 사용자가 App ID의 Sign in with Apple과 키를 만들고, `.p8`을 secrets에 등록(`APPLE_KEY_ID`·`APPLE_PRIVATE_KEY`). iPhone 개발자 모드를 켜고 실기기에 개발용 빌드 설치. 카카오·Apple 로그인과 회원탈퇴를 실기기에서 확인. 서버에서도 카카오·Apple 계정이 지워지는 것을 직접 조회로 확인(Apple 계정 삭제는 철회가 성공해야 일어나는 구조)
- 카카오 로그인이 Safari `localhost`로 빠지던 원인: `env/dev.json`에 `AUTH_REDIRECT_URL`이 없었다. 로그인 후 인앱 브라우저 창이 안 닫히는 문제는 `closeInAppWebView()`를 로그인 이벤트 처리가 아니라 앱 최상단(`main.dart`)에서 부르도록 옮겨 해결(이벤트 처리 쪽에 두었을 때는 효과가 없었고 원인은 끝내 확인하지 못했다)
- 앱·웹 UI 변경(PR #66): 구글 로그인 복원, 로그인 성공 알림(가운데 정렬, 3초), 로그아웃 확인 팝업, 내 정보에 회원탈퇴 추가·이름 통일, 확인 팝업 디자인 개선, 이메일 미표시, 랜덤 학습에서 이전/다음 숨김, 웹 푸터·앱 로그인 화면 정리, 웹 방침·약관의 "삭제 기능은 후속 제공" 옛 문구 수정
- 웹 컷오버: `develop` → `main`을 fast-forward 푸시(`fc70f27`), Production 배포 Ready, 운영 도메인 `devinterviewkr.vercel.app`에서 `/`·`/privacy`·`/terms`·`/me/login`·`/interview`·`/api/parse-pdf` 응답 확인. Supabase Site URL을 `http://localhost:3000`에서 운영 도메인으로 변경(허용 목록 유지)
- iOS 출시 빌드: `env/prod.json` 생성(`.gitignore`에 추가, #67), iPhone 전용으로 변경(`TARGETED_DEVICE_FAMILY=1`, #68), `flutter build ipa` 후 `xcodebuild -exportArchive`(destination upload)로 Xcode 로그인 계정을 이용해 App Store Connect에 업로드(1.0.0, 빌드 1). IPA의 서명(Store 프로필, get-task-allow 0)·Sign in with Apple 권한·Privacy Manifest 포함을 직접 확인
- App Store Connect 입력(사용자가 화면에서 입력, 제가 값 정리): 이름 `DevInterview - 개발자 면접`, 부제 `서술형 문제풀이와 이력서 맞춤 AI 면접`, 카테고리 교육/비즈니스, 연령 등급 4+, 앱 개인정보 6개 항목 게시, 심사 메모(영문), 지원 URL `/terms`, 콘텐츠 권한 안내. 스크린샷은 시뮬레이터(iPhone 17 Pro Max)에서 임시 통합 테스트로 6장 자동 촬영해 허용 크기(1206×2622)로 만들어 올림. **사용자가 심사에 제출했다고 알려옴**(심사 상태는 직접 확인하지 못함)
- 디스크가 가득 차(여유 181MB) 시뮬레이터 빌드가 실패해 `build/`·`webapp/.next`·Xcode DerivedData를 지워 8.9GB 확보
- 시도했지만 못 한 것: cmux 컴퓨터 제어(Computer Use 도우미가 실행되지 않아 사용 못 함), 자동 촬영에서 면접 두 번째 메시지가 전송되지 않은 현상의 원인 확인

### 주요 변경 파일
- lib/main.dart, lib/features/me/presentation/(account_actions.dart, me_page.dart, settings_page.dart), lib/features/practice/presentation/question_detail_page.dart, lib/features/auth/(data/auth_actions.dart, presentation/auth_providers.dart)
- webapp/components/(app-shell.tsx, use-account.ts, views/me-view.tsx, views/question-detail-view.tsx, views/privacy-view.tsx, views/terms-view.tsx)
- ios/Runner.xcodeproj/project.pbxproj, .gitignore, docs/plans/app-store-listing.md, docs/architecture.md
