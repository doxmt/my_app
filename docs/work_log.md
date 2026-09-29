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
