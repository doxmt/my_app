# M1 계획: Supabase 스키마 + 앱 골격

- 작성일: 2026-09-17
- 마일스톤: M1 (`docs/roadmap.md`)
- 관련 결정: ADR-002(웹 path URL + SPA rewrite 보강), ADR-009(키 주입, publishableKey), ADR-010(하단 탭 3개, 모바일 화면 우선)
- 상태: 확정. 구조 스케치: https://claude.ai/artifact/MgDZ3r2UzX3iky8AxuZh5E

## 1. 컨텍스트

- 현재 앱은 Flutter 템플릿(카운터) 상태다. `test/widget_test.dart`도 카운터 테스트 하나뿐이다.
- Supabase 프로젝트는 link만 돼 있다(`supabase/` 폴더는 있지만 마이그레이션이 없음). 이 프로젝트는 새 테이블을 Data API에 자동으로 노출하지 않고 RLS를 자동으로 켠다.
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0, iOS 배포 타깃 15.0, Android minSdk는 `flutter.minSdkVersion`.
- `web/index.html`은 `<base href="$FLUTTER_BASE_HREF">`를 쓴다. path URL 전략과 호환된다.
- 현재 `vercel.json`: `installCommand: "true"`, buildCommand는 flutter clone 후 `flutter build web --release`, `outputDirectory: build/web`, rewrites 없음.
- CI(`.github/workflows/ci.yml`)는 develop/main push·PR에서 pub get → analyze → test를 돌린다. 시크릿은 없다.
- 루트 `.gitignore`에 env 관련 항목이 없다.

### 확정된 결정 (사용자 인터뷰)

| # | 항목 | 결정 |
|---|---|---|
| Q1 | 마이그레이션 범위 | 테이블 12개 전부 + RLS + GRANT + pgvector. RPC 2개는 빼고 `increment_guest_usage`는 M3, `increment_daily_usage`는 M4에서 만든다 |
| Q2 | 디자인 | Material 3 + 시드 색상, 라이트/다크 |
| Q3 | 키 주입 | 로컬은 `--dart-define-from-file=env/dev.json`, Vercel은 환경변수를 `--dart-define`으로 넘긴다. CI는 provider override를 쓰므로 키가 필요 없다 |
| Q4 | 마이그레이션 검증 | 원격 DB에만 적용(`supabase db push`). Docker는 쓰지 않는다 |
| Q5 | 웹 URL | path URL + `vercel.json` SPA rewrite |
| Q6 | 내비게이션 구조 | 하단 탭 3개: 홈(`/`) · 모의면접(`/interview`) · 내 정보(`/me`). 오답노트는 내 정보 안(`/me/wrong-notes`) |
| Q7 | 웹 화면 | 모바일 화면을 먼저 만든다. 웹 전용 레이아웃(넓은 화면)은 M6에서 한다. 웹 빌드·배포·path URL은 M1부터 유지한다 |

### 채택 버전 (document-specialist 조사)

- `supabase_flutter` ^2.17.2 (3.x는 dev 버전이라 쓰지 않는다). `Supabase.initialize(url:, publishableKey:)`를 쓰고, deprecated된 `anonKey`는 쓰지 않는다.
- `flutter_riverpod` ^3.4.3. 코드젠 없이 provider를 직접 선언한다(단순성 원칙).
- `go_router` ^18.0.1
- `shared_preferences` ^2.5.5. `SharedPreferencesAsync`나 `SharedPreferencesWithCache`를 쓰고, 레거시 `SharedPreferences`는 쓰지 않는다.
- `uuid` ^4.5.3

## 2. 작업 목표

로그인 없이 Android/iOS/Web에서 앱이 뜨고, Supabase `categories`의 최상위 분야(`parent_id is null`)를 읽어 홈(`/`)에 목록을 보여준다. 데이터가 없으면 빈 상태 화면을 보여준다. 전체 스키마와 권한은 마이그레이션으로 원격 DB에 적용하고, 권한이 없는 테이블은 publishable key로 접근하면 거부된다.

## 3. 가드레일

### 반드시 해야 할 것 (Must)

- 12개 테이블 모두 `enable row level security`를 명시하고, 테이블마다 필요한 GRANT와 정책을 직접 쓴다.
  - `categories` / `rate_limit_config`: anon·authenticated에 `select` GRANT를 주고, 모두에게 select 정책을 연다.
  - `questions`: anon·authenticated에 `select` GRANT를 주고, 정책은 `is_published = true`인 행만 허용한다.
  - `guest_daily_usage`: GRANT도 정책도 두지 않는다(Edge Function의 service role만 접근).
  - `question_candidates`: anon 권한은 없다. authenticated에 GRANT를 주고, 정책은 `profiles.is_admin = true`인 사용자만 허용한다.
  - `profiles` / `practice_attempts` / `wrong_notes` / `resumes` / `interview_sessions`: authenticated에만 GRANT를 주고, 정책은 `auth.uid() = user_id`(profiles는 `id`)로 건다.
  - `interview_messages`: authenticated에만 GRANT를 주고, `interview_sessions`와 join해서 세션 소유자만 허용한다.
  - `daily_usage`: authenticated에 `select` GRANT만 주고, 본인 행만 읽을 수 있게 한다. 쓰기 권한은 주지 않는다.
- pgvector는 `create extension if not exists vector with schema extensions;`로 켜고, 컬럼 타입은 `extensions.vector(1536)`로 쓴다.
- FK 컬럼에 인덱스를 만든다(RLS 조건에 쓰는 `user_id`, `session_id` 포함).
- Supabase 클라이언트, 카테고리 리포지토리, 기기 ID 저장소는 Riverpod provider로 제공한다. 테스트에서는 이 provider들을 override해서 네트워크와 키 없이 `flutter test`가 통과해야 한다.
- 코드는 feature-first 3계층(`data/` · `domain/` · `presentation/`)으로 나눈다. domain은 Supabase를 import하지 않는다.
- `env/dev.json`과 `supabase/.temp`는 커밋하지 않는다(gitignore로 막는다).

### 절대 하지 말 것 (Must Not)

- 로그인 화면, OAuth, 익명 로그인 (M4 범위)
- Edge Function, LLM 호출, RPC 함수 (M3/M4 범위)
- `categories`/`questions`에 쓰기 GRANT나 쓰기 정책 추가
- 한도 숫자 하드코딩, `rate_limit_config` 초기값 insert (M3 범위)
- 기기 ID를 데이터 조회 키로 사용
- 시드 데이터 추가 (M2 범위)
- 데스크톱 플랫폼 폴더 재생성
- 분야 → 주제 화면, 학습하기/문제풀기 화면 (M2 범위. M1 홈은 분야 목록만 보여준다)
- 웹 전용 레이아웃(넓은 화면용 NavigationRail, 본문 폭 제한 등) (M6 범위)

## 4. 작업 흐름

```
1 스키마 ──────────────┐
2 부트스트랩·테마·설정 ─┼─> 4 categories feature ──┐
3 기기 ID ─────────────┘   (domain/data/목록 위젯)   ├─> 6 테스트·플랫폼 검증·문서
2 부트스트랩 ─────────────> 5 라우팅·하단 탭 셸 ────┘
```

- 1단계와 2·3단계는 서로 의존하지 않으므로 순서를 바꿔도 된다.
- 5단계는 2단계 이후 바로 할 수 있고, 4단계의 `CategoriesPage`를 홈 탭에 연결한다.

## 5. 상세 TODO

### 1단계. Supabase 스키마 마이그레이션 적용

- `supabase init`을 실행한다. 실행 후 아래 두 가지를 확인한다.
  - `supabase/.temp/linked-project.json`이 그대로 남아 있는지. 없어졌으면 `supabase link`를 다시 실행한다.
  - `supabase/.gitignore`가 생성됐고 `.temp`를 제외하는지. 아니면 루트 `.gitignore`에 추가한다.
- `supabase/migrations/<timestamp>_init_schema.sql`을 작성한다. 내용은 확장, 12개 테이블(`docs/architecture.md` 데이터 모델 기준, check 제약 포함), FK 인덱스, RLS enable, GRANT, 정책이다. RPC는 넣지 않는다.
- `supabase db push`로 원격에 적용한다.

**인수 기준**
- `supabase migration list`에서 로컬과 원격 목록이 같다.
- publishable key로 `GET /rest/v1/categories`를 호출하면 `200`과 `[]`가 온다.
- publishable key로 `GET /rest/v1/guest_daily_usage`와 `GET /rest/v1/question_candidates`를 호출하면 `403`과 `code: "42501"`(permission denied)이 온다.
- publishable key로 `POST /rest/v1/categories`를 호출하면 거부된다.
- Supabase security advisors에 RLS 관련 경고가 없다.

### 2단계. 의존성, 부트스트랩, 테마, 환경 설정

- `pubspec.yaml`에 위에서 정한 패키지 5개를 추가한다.
- `lib/app/app_config.dart`: `String.fromEnvironment('SUPABASE_URL')`, `String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY')`를 읽는다. 값이 비어 있으면 어떤 값이 빠졌는지 알려주는 에러를 낸다.
- `env/dev.json.example`을 커밋하고, `env/dev.json`은 `.gitignore`에 추가한다.
- `lib/core/supabase/`에 `supabaseClientProvider`를 만든다.
- `lib/app/theme.dart`: Material 3 `ColorScheme.fromSeed`로 라이트/다크 테마를 만들고 `ThemeMode.system`을 쓴다.
- `main.dart`: `usePathUrlStrategy()`(runApp 전 최상단) → `AppConfig` 검증 → `Supabase.initialize(url:, publishableKey:)` → `ProviderScope` → `MaterialApp.router`(`lib/app/router.dart`의 라우터) 순서로 구성한다.
- `vercel.json`
  - buildCommand에 `--dart-define=SUPABASE_URL=$SUPABASE_URL --dart-define=SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE_KEY`를 추가한다.
  - `"rewrites": [{"source": "/(.*)", "destination": "/index.html"}]`를 추가한다. 적용 전에 https://vercel.com/docs/project-configuration#rewrites 에서 문법을 확인한다.
  - Vercel 프로젝트에 환경변수 2개(Preview/Production)를 등록하는 절차는 작업 보고로 사용자에게 전달한다(`docs/current_state.md`는 `/wrap`에서만 갱신).

**인수 기준**
- `flutter run -d chrome --dart-define-from-file=env/dev.json`로 앱이 정상 실행된다.
- define 없이 실행하면 어떤 값이 빠졌는지 알려주는 메시지와 함께 실패한다.
- `git status`에 `env/dev.json`이 나오지 않는다.
- `flutter analyze`가 통과한다.

### 3단계. 기기 ID

- `lib/core/device/device_id.dart`
  - 작은 저장소 인터페이스(`DeviceIdStore`: read/write)를 정의한다. 실제 구현은 `SharedPreferencesAsync`를 쓴다.
  - 최초 호출 때 UUID v4를 만들어 저장하고, 이후 호출에서는 저장된 값을 돌려준다.
  - `deviceIdProvider`로 제공한다.
- 테스트는 in-memory fake store를 주입한다. `setMockInitialValues`는 새 API에서 지원하지 않으므로 쓰지 않는다.

**인수 기준**
- 단위 테스트: 첫 호출에서 UUID v4를 만들어 저장한다.
- 단위 테스트: 두 번째 호출은 첫 번째와 같은 값을 돌려준다.
- 수동 확인: 웹에서 새로고침한 뒤에도 같은 값이 유지된다(디버그 로그 등으로 확인).

### 4단계. categories feature

- `lib/features/categories/domain/`: `Category` 모델(`fromJson` 포함)과 `CategoryRepository` 인터페이스.
- `lib/features/categories/data/`: Supabase 구현. 최상위 분야(`parent_id is null`)를 `sort_order` 순으로 가져온다.
- `lib/features/categories/presentation/`: `categoryRepositoryProvider`, `categoriesProvider`, 그리고 로딩/에러/빈 상태/분야 목록을 보여주는 `CategoriesPage` 위젯(홈 탭 본문). 셸에 의존하지 않는다. 분야를 눌렀을 때의 이동은 M2에서 붙인다.

**인수 기준**
- `Category.fromJson` 단위 테스트가 통과한다.
- 실제 DB(빈 상태)로 앱을 열면 홈에 빈 상태 문구가 보인다.
- 네트워크 오류가 나면 에러 문구와 재시도 버튼이 보인다.

### 5단계. 라우팅과 하단 탭 셸

- `lib/app/router.dart`: go_router `StatefulShellRoute.indexedStack`로 하단 `NavigationBar` 탭 3개를 만든다.
  - 홈 `/` → `CategoriesPage`
  - 모의면접 `/interview` → placeholder
  - 내 정보 `/me` → placeholder 메뉴(오답노트 항목 하나), 하위 라우트 `/me/wrong-notes` → placeholder
- 탭 전환은 `navigationShell.goBranch(index)`를 쓴다. 각 탭의 스크롤·이동 상태가 유지돼야 한다.
- 레이아웃은 모바일 기준으로만 만든다. 넓은 화면 대응은 하지 않는다(M6).

**인수 기준**
- 하단 탭 3개로 홈/모의면접/내 정보를 오갈 수 있고, 내 정보 → 오답노트로 들어갔다가 뒤로 돌아올 수 있다.
- 웹에서 화면을 이동하면 URL(`/`, `/interview`, `/me`, `/me/wrong-notes`)이 함께 바뀐다.
- Vercel Preview에서 `/me/wrong-notes`로 직접 접속하거나 새로고침해도 404가 나지 않는다.

### 6단계. 테스트 정리, 플랫폼 검증, 문서

- `test/widget_test.dart`의 카운터 테스트를 지우고, fake repository와 fake device store를 override한 위젯 테스트로 바꾼다.
  - 앱 렌더링
  - 카테고리 빈 상태 / 목록 상태
  - 하단 탭 전환, 내 정보 → 오답노트 이동
- 수동 확인: Android 에뮬레이터, iOS 시뮬레이터, Chrome에서 실행한다.
- `docs/current_state.md`·`docs/work_log.md`는 건드리지 않는다(`/wrap`에서 갱신). 플랫폼별 특이사항이 발견되면 `CLAUDE.md`의 Non-Obvious Rules에 적는다.

**인수 기준**
- `flutter analyze`와 `flutter test`가 통과한다.
- 시크릿 없이 CI가 녹색이다.
- 세 플랫폼 모두에서 앱이 뜨고 홈에 분야 빈 상태가 보인다(웹은 모바일 레이아웃 그대로여도 된다).
- develop에 push한 뒤 Vercel Preview에서도 같은 화면이 보인다.

## 6. 성공 기준

- [ ] 원격 DB에 12개 테이블, RLS, GRANT, pgvector가 마이그레이션으로 적용됐고 로컬과 원격 기록이 같다.
- [ ] publishable key로 공개 테이블은 읽히고, 비공개 테이블은 `403 / 42501`로 거부된다.
- [ ] Android/iOS/Web에서 로그인 없이 홈(`/`)에 분야 목록 또는 빈 상태가 보인다.
- [ ] 기기 ID가 한 번 만들어진 뒤 재실행·새로고침 후에도 유지된다.
- [ ] 네트워크와 키 없이 `flutter test`가 통과하고 CI가 녹색이다.
- [ ] 웹 path URL이 Vercel에서 직접 접속과 새로고침 모두에서 동작한다.
- [ ] 하단 탭 3개(홈/모의면접/내 정보)와 `/me/wrong-notes` 이동이 동작한다.

## 7. 미해결 항목

`docs/plans/open-questions.md`의 "M1 Supabase 스키마 + 앱 골격" 섹션을 본다.
