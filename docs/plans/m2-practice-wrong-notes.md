# M2. 카테고리/문제풀이 + 로컬 오답노트

작성일: 2026-09-18
대상: `docs/roadmap.md`의 M2
선행: M1 (PR #2) 완료

## 컨텍스트

M1으로 Supabase 연결, 기기 ID, 하단 탭 3개, 홈의 최상위 분야 목록까지 끝났다. 현재 상태:

- `lib/features/categories/`에 `Category` 모델과 `CategoryRepository.fetchTopLevelCategories()`(`parent_id is null`, `sort_order` 정렬)만 있다. 하위 주제·문제 조회는 없다.
- `supabase/migrations/20260917082153_init_schema.sql`에 12개 테이블이 이미 있다. `questions`는 `type`/`prompt`/`model_answer`/`is_published`를 갖고, 공개 select 정책은 `is_published = true`만 노출한다. **M2에 새 테이블은 필요 없다.**
- DB에 카테고리·문제 데이터가 없어 홈이 빈 상태다.
- `lib/core/storage/`(비회원 로컬 저장)는 아직 없다. 로컬 저장 의존성은 `shared_preferences: ^2.5.5`뿐이고, `lib/core/device/device_id.dart`가 신규 API인 `SharedPreferencesAsync`를 쓰고 있다.
- `lib/core/error/`(Result/Failure 타입)는 아직 없다. 현재 패턴은 Exception을 그대로 던지고 UI에서 `AsyncValue.when(loading/error/data)`으로 처리한다.
- `/me/wrong-notes` 라우트와 빈 페이지는 이미 있다.

### 인터뷰에서 확정된 사항

| 항목 | 결정 |
|---|---|
| 학습 방식 | **학습하기 + 문제풀기 2갈래**. 랜덤 학습/랜덤 문제풀기는 범위 밖 |
| 분야 시드 | **CS, 프론트엔드 2개 뼈대만**. 분야당 주제 2개 × 문제 3개 (총 12문제) |
| 문제 유형 | **서술형(`descriptive`)만** |
| 로컬 저장 | **`shared_preferences`(`SharedPreferencesAsync`) + JSON** |
| 답변 시도 기록 | **저장하지 않음.** 오답노트만 로컬에 남긴다 |

마지막 항목의 트레이드오프(M4에서 `practice_attempts`로 올릴 데이터가 없음)는 사용자에게 안내했고 그대로 유지한다. ADR-012에 기록했다.

### 사전 조사 결론

**go_router 18.0.1**
- `StatefulShellRoute.indexedStack`의 branch 안에서 `GoRoute.routes`로 재귀 중첩하는 것이 공식 패턴이고 깊이 제한이 없다. 4단계 중첩이 가능하며, indexedStack이 branch별 Navigator를 유지하므로 깊이 들어가도 하단 탭이 유지된다.
- **드릴다운 이동은 `context.push()`** — 스택에 쌓여 pop으로 한 단계씩 돌아온다. `context.go()`는 스택을 교체하므로 단계적 뒤로가기를 보장하지 않는다.

**shared_preferences 2.5.5**
- 레거시 `SharedPreferences.getInstance()`는 향후 deprecated 예정으로 공식 표시됐다. 신규 코드는 `SharedPreferencesAsync`를 쓴다. `device_id.dart`가 이미 이 API를 쓰고 있어 일관된다.
- 웹은 localStorage 백엔드(5~10MB, 시크릿 모드에서 휘발 가능). "쓰기가 디스크에 즉시 반영된다는 보장 없음 → 손실돼도 치명적이지 않은 데이터에만" 공식 경고가 있다. 오답노트는 이 조건에 맞는다.

**기존 코드 패턴**
- 의존성 주입은 `Provider<T>`, 비동기 조회는 `FutureProvider<T>`, 네이밍은 `xxxProvider`.
- 테스트는 인터페이스를 구현한 Fake 클래스 + `overrideWithValue()`. `ProviderContainer`로 유닛 테스트, `ProviderScope(overrides: [...])`로 위젯 테스트.
- 테마는 Material 3, 시드 색상 `Color(0xFF1F5A4A)`, 라이트/다크 모두 제공.

## 작업 목표

로그인 없이 **분야 → 학습 방식 → 주제 → 문제 목록 → 문제 상세**까지 들어가서, 문제풀기 모드로 답변을 쓰고 모범답안을 확인해 자가 채점하고, 오답노트에 저장·해결 처리할 수 있게 한다. 오답노트는 앱을 껐다 켜도 남는다.

## 가드레일

### 반드시 지킨다

- feature-first + 3계층(`data/` `domain/` `presentation/`). `domain/`은 Supabase 없이 단위 테스트 가능해야 한다.
- **학습하기와 문제풀기는 `lib/features/practice/` 하나에 둔다.** 별도 `features/study/`를 만들지 않는다. 두 모드는 같은 문제 데이터를 쓰고 표시 방식만 다르다.
- 드릴다운 이동(분야 → 모드 → 주제 → 문제)은 **`context.push()`**. 탭 전환이나 `/me` → `/me/wrong-notes` 같은 1단계 이동은 기존대로 `context.go()`를 유지한다.
- 로컬 저장은 `lib/core/storage/` 공용 계층을 거친다. 위젯이 `SharedPreferencesAsync`를 직접 만지지 않는다.
- 로컬 저장은 **`SharedPreferencesAsync`**(신규 API). `SharedPreferences.getInstance()`를 쓰지 않는다.
- 오답노트 리포지토리는 인터페이스 + 로컬 구현으로 둔다 (M4에서 Supabase 구현을 끼울 자리).
- 에러 처리는 **기존 패턴 그대로** — Exception을 던지고 UI에서 `AsyncValue.when`으로 받는다. `lib/core/error/`(Result/Failure)는 아직 없고, 이번에 만들지 않는다.
- 테스트는 **Fake 클래스 + `overrideWithValue()`** 패턴을 따른다. mock 라이브러리를 새로 넣지 않는다.
- 시드는 `supabase/migrations/`에 새 마이그레이션 파일로 넣고 `supabase db push`로 적용한다. 재실행해도 중복되지 않게 `on conflict do nothing`으로 쓴다.
- 새 문제는 `is_published = true`로 넣는다 (기본값이 `false`라 켜지 않으면 앱에서 안 보인다).
- 화면은 모바일 레이아웃 기준, Material 3 기본 테마 + 기존 시드 색상.
- `flutter analyze` / `flutter test` 통과.

### 하지 않는다

- 로그인·익명 로그인·어드민 기능 (M4/M5).
- 답변 시도 이력(`practice_attempts` 대응 로컬 데이터) 저장. 자가 채점 결과는 화면을 벗어나면 사라진다.
- 앱에서 `categories`/`questions`에 쓰기.
- 객관식(`multiple_choice`) UI, 랜덤 학습/랜덤 문제풀기.
- 웹 전용 레이아웃(M6), 커스텀 디자인 시스템.
- 새 테이블·스키마 변경. 필요해지면 GRANT와 RLS 정책을 같은 마이그레이션에 반드시 함께 쓴다.
- `docs/current_state.md`, `docs/work_log.md` 수정 (`/wrap` 전용).

## 작업 흐름

### 1단계 — 시드 마이그레이션 + 카테고리/문제 조회 계층

- 새 마이그레이션 `supabase/migrations/{ts}_seed_m2_content.sql`
  - 최상위 분야 2개: CS(`cs`), 프론트엔드(`frontend`)
  - 분야별 하위 주제 2개 (총 4개)
  - 주제별 서술형 문제 3개 (총 12개), 전부 `type = 'descriptive'`, `is_published = true`, `model_answer` 채움
  - `slug`에 `on conflict do nothing`으로 멱등하게 작성
- `CategoryRepository`에 `fetchChildCategories(parentId)` 추가, `SupabaseCategoryRepository`에 구현.
- `lib/features/practice/` 신설
  - `domain/question.dart` — `id`, `categoryId`, `type`, `prompt`, `modelAnswer`, `difficulty`, `tags` + `fromJson`
  - `domain/question_repository.dart` — `fetchQuestionsByCategory(categoryId)`, `fetchQuestionById(id)`
  - `data/supabase_question_repository.dart`
  - `presentation/practice_providers.dart` — `questionRepositoryProvider`(Provider), 조회는 `FutureProvider.family`

**인수 기준**
- `supabase db push` 후 `categories` 6행(분야 2 + 주제 4), `questions` 12행이 들어간다.
- 같은 마이그레이션을 두 번 적용해도 행이 늘지 않는다.
- publishable key로 `questions`를 조회하면 12행이 오고, `is_published = false`로 바꾼 행은 오지 않는다.
- `Question.fromJson` 단위 테스트가 `test/features/practice/domain/question_test.dart`에 있고 통과한다.

### 2단계 — 라우팅 + 탐색 화면 3개

- 홈(`/`) 브랜치 하위에 중첩 라우트를 추가한다 (기존 `/me` → `wrong-notes` 중첩과 같은 방식).
  - `/categories/:field` — 분야 화면. 학습하기 / 문제풀기 선택
  - `/categories/:field/:mode` — 주제 목록. `mode`는 `study` | `practice`
  - `/categories/:field/:mode/:topic` — 문제 목록
  - `/categories/:field/:mode/:topic/:questionId` — 문제 상세 (3단계에서 채움)
- 화면 이동은 전부 `context.push()`.
- `mode` 경로 파라미터가 `study`/`practice`가 아니면 분야 화면으로 되돌린다.
- 각 화면에 로딩 / 에러 / 빈 상태를 `AsyncValue.when`으로 처리한다.

**인수 기준**
- 홈에서 CS → 문제풀기 → 주제 → 문제 목록까지 탭만으로 도달하고, 각 단계에서 하단 탭이 계속 보인다.
- 기기 뒤로가기와 앱바 뒤로가기가 **한 단계씩** 되돌아간다 (문제 목록 → 주제 목록 → 분야 화면 → 홈).
- 웹에서 `/categories/cs/practice` URL을 직접 입력해도 해당 화면이 뜬다 (path URL + SPA rewrite).
- 문제가 없는 주제에 들어가면 빈 상태 문구가 뜬다.
- 잘못된 `mode` 값으로 접근해도 앱이 죽지 않는다.

### 3단계 — 문제 상세 (학습하기 / 문제풀기)

- 같은 화면에서 `mode`로 동작을 나눈다.
  - **학습하기**: 문제와 모범답안을 처음부터 함께 보여준다. 답변 입력창 없음.
  - **문제풀기**: 답변 입력 → "모범답안 보기" → 내 답변과 모범답안을 함께 표시 → "정답 / 오답" 자가 채점 버튼.
- 자가 채점 후 "오답노트에 저장" 버튼을 노출한다 (정답을 골라도 저장 가능).
- 문제 목록 안에서 이전 / 다음 문제로 이동한다.
- 자가 채점 결과와 작성한 답변은 **화면 상태로만** 들고 있고 어디에도 저장하지 않는다.

**인수 기준**
- 학습하기로 들어가면 답변 입력창 없이 모범답안이 보인다.
- 문제풀기로 들어가면 모범답안이 가려져 있고, "모범답안 보기"를 누르기 전에는 볼 수 없다.
- 자가 채점 결과를 고른 뒤 화면을 벗어났다 돌아오면 초기 상태다 (기록 미저장 — 의도된 동작).
- `model_answer`가 비어 있는 문제에서도 화면이 깨지지 않는다.
- 마지막 문제에서 "다음"이 비활성화된다.

### 4단계 — 로컬 저장 계층 + 오답노트

- `lib/core/storage/local_json_store.dart`
  - `SharedPreferencesAsync` 위에 키 → JSON 읽기/쓰기. 저장 데이터에 스키마 버전 필드를 함께 넣는다.
  - 인터페이스로 두고 테스트에서 in-memory fake를 주입한다 (`device_id.dart`의 `DeviceIdStore`와 같은 형태).
- `lib/features/wrong_notes/`
  - `domain/wrong_note.dart` — `questionId`, `categoryId`, `questionPrompt`, `savedAt`, `isResolved`, `resolvedAt`
  - `domain/wrong_note_repository.dart` — 인터페이스 (M4에서 Supabase 구현을 끼울 자리)
  - `data/local_wrong_note_repository.dart` — `LocalJsonStore` 기반 구현
  - `presentation/` — 기존 `wrong_notes_page.dart`를 채우고 provider 추가
- `questionPrompt`를 스냅샷으로 함께 저장한다. 목록을 열 때마다 Supabase를 왕복하지 않고 오프라인에서도 보인다. DB `wrong_notes`에는 대응 컬럼이 없지만 M4 업로드에는 `questionId`만 쓰므로 문제없다.
- 같은 문제를 두 번 저장하면 덮어쓴다 (DB의 `unique(user_id, question_id)`와 동작을 맞춤).
- `/me/wrong-notes` 화면: 목록, 해결 처리 토글, 삭제, 항목 탭 시 해당 문제 상세로 이동. `/me`에 오답노트 진입점 추가.

**인수 기준**
- 문제 상세에서 "오답노트에 저장" → `/me/wrong-notes`에 즉시 나타난다.
- 앱을 완전히 종료 후 재실행해도 목록이 유지된다 (iOS / Web 각각 확인).
- 같은 문제를 두 번 저장해도 항목이 하나다.
- 해결 처리한 항목이 목록에서 구분되고, 그 상태도 재시작 후 유지된다.
- 네트워크가 끊긴 상태에서도 오답노트 목록의 문제 문구가 보인다.
- `LocalWrongNoteRepository` 단위 테스트가 in-memory fake store로 통과한다 (Supabase 없이).
- 오답노트 페이지 위젯 테스트가 Fake 리포지토리 + `overrideWithValue()`로 통과한다.

### 5단계 — 검증 + 문서 정합성 확인

문서 갱신은 계획 승인 단계에서 이미 반영됐다 (`docs/prd.md`, `docs/roadmap.md`, `docs/overview.md`, `docs/adr.md` ADR-012, `docs/plans/open-questions.md`, `docs/architecture.md`). 이 단계에서는 **구현 결과가 그 문서와 맞는지 확인**한다.

- `docs/overview.md`·`docs/architecture.md`의 디렉토리 구조가 실제 `lib/` 구조와 일치하는지 확인한다. 특히 `features/practice/` 하나로 통일돼 있고 `features/study/`가 없어야 한다.
- ADR-012의 내용(로컬 저장 방식, 답변 기록 미저장)이 실제 구현과 맞는지 확인한다.
- 구현 중 새로 드러난 미결 사항이 있으면 `docs/plans/open-questions.md`에 추가한다.
- `flutter analyze` + `flutter test` 실행.
- iOS 시뮬레이터와 Chrome에서 전체 여정을 직접 확인한다.

**인수 기준**
- `flutter analyze` 무경고, `flutter test` 전부 통과.
- 문서의 디렉토리 구조·설계 설명이 실제 코드와 어긋나지 않는다.
- iOS 시뮬레이터와 Chrome에서 홈 → 문제풀이 → 오답노트 저장 → 재시작 후 유지까지 확인된다.
- Android는 이 Mac에 AVD가 없어 미확인 (`docs/current_state.md`의 기존 제약). AVD를 만들면 확인한다.

## 성공 기준 (M2 전체)

roadmap의 "로그인 없이 문제풀이와 오답노트가 앱 재시작 후에도 유지됨"을 다음으로 구체화한다.

1. 로그인 없이 홈 → 분야 → 학습 방식 → 주제 → 문제 목록 → 문제 상세까지 도달한다.
2. 학습하기 모드는 모범답안을 바로 보여주고, 문제풀기 모드는 "모범답안 보기" 전까지 가린다.
3. 문제풀기에서 자가 채점 후 오답노트에 저장할 수 있다.
4. 오답노트 목록과 해결 처리 상태가 앱 재시작 후에도 남는다.
5. 드릴다운 각 단계에서 하단 탭이 유지되고, 뒤로가기가 한 단계씩 동작한다.
6. 앱에서 `categories`/`questions`에 쓰기를 시도하는 코드가 없다.
7. `flutter analyze` + `flutter test` 통과.

## 범위 밖

- 랜덤 학습 / 랜덤 문제풀기
- 객관식 문제 UI
- 학습 기록·학습 통계 화면
- 나머지 분야(백엔드, AI, 모바일, DevOps) 콘텐츠
- 이력서·모의면접 (M3), 로그인 (M4), 어드민 (M5)
- 웹 전용 레이아웃 (M6)

## Open Questions

`docs/plans/open-questions.md`의 M2 항목을 본다. 이번 계획 시점의 미결 사항:

- 오답노트 "해결 처리"한 항목을 목록에서 숨길지, 필터 토글로 볼 수 있게 할지 — 4단계 구현 중 결정
- 로컬 저장 JSON의 스키마 버전을 어떻게 올릴지 — M4 업로드 때 옛 형식이 남아 있으면 파싱이 깨진다
- 카테고리 계층을 분야 → 주제 2단계로 고정할지 — `parent_id`는 임의 깊이를 허용하지만 화면은 2단계만 가정한다
- 랜덤 학습 / 랜덤 문제풀기를 어느 마일스톤에 넣을지
- 나머지 분야 시드를 언제 넣을지 — M5 어드민 파이프라인 이후가 될 수 있다
- 학습 통계/학습 기록 화면이 필요해지는 시점 — 필요해지면 그때부터 답변 기록을 쌓기 시작한다
