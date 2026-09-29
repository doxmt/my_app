# 웹 버전 만들기 — 반응형 레이아웃 (M6 웹 전용 레이아웃 선행)

작성: 2026-09-28
관련: ADR-010(모바일 화면 우선, 웹 전용 레이아웃은 M6), 로드맵 M6

> **대체됨 (2026-09-29): Next 웹 전환으로 대체됨.** 웹 클라이언트를 Next.js(`webapp/`)로 새로 만들기로 결정해 이 계획(이슈 #23)은 폐기한다. #23의 코드·문서 변경은 되돌린다. 후속 계획: `docs/plans/nextjs-web.md`

## 컨텍스트

이 앱은 M1부터 Android/iOS/Web 세 플랫폼이 대상이고, 웹은 **빌드·Vercel 배포·path URL만** 유지해 왔다. 즉 웹이 "안 돌아가는" 상태가 아니라, **모바일 레이아웃이 넓은 화면에 그대로 늘어나 보이는** 상태다 (ADR-010 트레이드오프에 명시).

따라서 이번 "웹 버전 만들기"는 새 웹 프로젝트를 만드는 작업이 아니라, **M6에 미뤄뒀던 "웹 전용 레이아웃(넓은 화면 NavigationRail + 본문 폭 제한)"을 지금 당겨서 하는 작업**이다. (사용자 확인 완료)

전제 조건 하나가 비어 있다: `docs/current_state.md`의 **"웹(Chrome) 모의면접 종단 검증 미완료"** — curl 스모크만 됐고 실제 Flutter 웹 빌드에서 SSE 스트리밍이 청크 단위로 도착하는지 확인되지 않았다. 레이아웃만 다듬어도 핵심 기능이 웹에서 안 되면 "웹 버전"이 성립하지 않으므로, 종단 스모크를 1단계에 둔다.

### 조사로 이미 확정된 사실 (다시 조사하지 말 것)

| 항목 | 확정 내용 |
|---|---|
| 셸 위젯 위치 | `lib/app/widgets/app_shell.dart`의 `AppShell.build()` — `NavigationBar`(M3 bottom nav)가 라인 14-39. **반응형 분기는 이 한 곳에서만** 하면 된다 |
| 라우터 | `lib/app/router.dart`의 `StatefulShellRoute.indexedStack`(라인 23-138). 3개 탭. **수정 불필요** |
| 기존 반응형 코드 | `LayoutBuilder` 미사용, breakpoint 상수 미정의 → 새로 도입. `kIsWeb` 사용처는 전부 OAuth 플랫폼 분기(`auth/` 하위)라 레이아웃과 무관, 충돌 없음 |
| 홈 분야 카드 | `categories_page.dart`가 이미 `GridView.builder(maxCrossAxisExtent: 220)` → **폭에 따라 열 수 자동 조정됨. 추가 작업 불필요 가능성 높음** |
| 로그인 화면 | `login_page.dart`가 이미 `ConstrainedBox(maxWidth: 360)` → **추가 작업 불필요.** 1단계 스모크에서 눈으로 재확인만 |
| `web/index.html` | `<title>DevInterview`, description, apple-mobile-web-app-title, favicon, Apple Touch Icon 전부 이미 설정됨 → **정리 작업 불필요** |
| `vercel.json` | `rewrites: [{ source: "/(.*)", destination: "/index.html" }]` SPA rewrite 이미 적용 → URL 직접 진입 문제 없을 것으로 예상 |
| 웹 SSE 스트리밍 | `package:http` 1.3.0부터 `BrowserClient`가 XHR → **Fetch API로 전환되어 응답 스트리밍이 기본 동작**. 프로젝트는 `http: 1.6.0`(pubspec.lock) 사용 → **이론상 이미 동작함. 패키지 교체를 사전에 계획에 넣지 않는다.** 요청(업로드) 스트리밍 제약은 이 프로젝트와 무관(일반 POST) |
| breakpoint | **Material 3 공식 window size class 기준 600dp 단일 breakpoint 채택** (Compact <600 / Medium 600-839 / Expanded 840+). M3는 Medium부터 NavigationRail을 권고한다. `flutter_adaptive_scaffold`는 자체 기본값(700/1000/…)을 쓰고 pubspec에도 없으므로 **채택하지 않고 `LayoutBuilder`로 직접 구현** |
| SSE 파싱 코드 | `lib/features/interview/data/http_interview_chat_client.dart`의 `streamReply()`(라인 72-150) — `client.send()` → `StreamedResponse.stream.transform(utf8.decoder)` → `\n\n` 구분 수동 파싱(`_parseEvent`, 라인 152-166) |

## 작업 목표

Chrome 데스크톱에서 전체 여정(카테고리 → 문제풀이 → 오답노트 → 이력서 → 모의면접 → 로그인)이 **동작하고**, 넓은 화면에 맞는 레이아웃으로 **보이게** 한다. 모바일(Android/iOS) 레이아웃은 작업 전과 동일하게 유지한다.

## 가드레일

**반드시**
- 하나의 Flutter 코드베이스 안에서 **화면 폭 기준 분기(`LayoutBuilder`)로만** 처리한다. `kIsWeb`은 레이아웃 분기에 쓰지 않는다 (폭 기준이면 태블릿에도 자동 적용된다).
- breakpoint는 **600dp 단일값**, 상수 한 곳(`lib/app/` 하위)에 정의해 재사용한다. 매직넘버를 화면마다 흩뿌리지 않는다.
- 반응형 분기는 **`AppShell` 한 곳**에서 한다. 좁은 화면용(`NavigationBar`)/넓은 화면용(`NavigationRail`) 자식 위젯 모두 `navigationShell.currentIndex`와 `goBranch()` 콜백을 그대로 전달받아, **라우팅 로직은 건드리지 않는다.**
- 넓은 화면에서 깨지는 화면을 **1단계에서 먼저 목록화한 뒤** 고친다. 추측으로 전체 화면을 선제 수정하지 않는다 (홈 그리드·로그인은 이미 대응돼 있다).
- 변경 후 `flutter analyze` / `flutter test` 통과 + **Chrome과 iOS 시뮬레이터 양쪽에서 직접 확인** (CLAUDE.md Definition of Done).

**절대 금지**
- 별도 웹 전용 프로젝트/코드베이스 신설 금지. 웹용으로 화면 파일을 통째로 복제하지 않는다.
- 라우트 경로(`/`, `/interview`, `/me`, `/me/wrong-notes` …)와 `StatefulShellRoute.indexedStack` 구조 변경 금지. URL이 바뀌면 안 된다.
- 데스크톱 플랫폼 폴더(`macos/`, `windows/`, `linux/`) 재생성 금지.
- `flutter_adaptive_scaffold` 등 새 레이아웃 패키지 추가 금지.
- 문제/카테고리 콘텐츠를 SQL 마이그레이션으로 건드리지 않는다.
- 어드민(`admin/`) 수정 금지 — 이미 React 웹앱이고 이번 범위 아님.
- 아키텍처 재설계(상태관리 교체, 라우터 교체, 디자인 시스템 도입) 금지. 레이아웃 래핑 수준으로 끝낸다.
- **M6 잔여 항목(로딩·에러·빈 상태 정리, 오프라인 처리, 접근성)은 이번 범위 밖.** 눈에 띄어도 고치지 말고 기록만 한다.
- `docs/current_state.md`·`docs/work_log.md`는 건드리지 않는다 (`/wrap` 전용).

## 작업 흐름

```
1. 웹 종단 스모크 → 동작 결함 / 레이아웃 결함 분리 목록
2. 반응형 셸 (AppShell: 600dp 기준 NavigationRail + 본문 폭 제한)
3. 1단계 목록의 레이아웃 결함 화면만 대응
4. (조건부) 1단계에서 나온 동작 버그 수리
5. 문서 갱신 + Vercel Preview 확인
```

## 상세 TODO

### 1. 웹 종단 스모크 + 결함 목록화

`flutter run -d chrome --dart-define-from-file=env/dev.json`으로 전체 여정을 직접 밟으며 결함을 **동작 결함**과 **레이아웃 결함**으로 분리해 기록한다.

확인 경로:
- 홈 분야 카드 → 학습하기/문제풀기 선택 → 주제 목록 → 문제 목록 → 문제 상세 → 답변 작성 → 모범답안 → 자가 채점
- 오답노트 저장 → `/me/wrong-notes` 목록 → 해결 처리
- 이력서 텍스트 붙여넣기 / PDF 업로드(Vercel 파싱 함수)
- **모의면접 메시지 전송 — 응답이 청크 단위로 점진 표시되는지, 한 번에 뭉쳐 나오는지 반드시 눈으로 판정**
- 로그인 화면 진입 및 Google/GitHub 리다이렉트 복귀 (콘솔 설정 미완이면 "화면 진입 + 리다이렉트 시작"까지만)
- 새 탭에서 `/interview`, `/me/wrong-notes` 직접 입력 진입 + 새로고침 (SPA rewrite 확인)

**인수 기준**
- 위 경로 각각이 `OK` / `동작 깨짐` / `레이아웃만 깨짐` 중 하나로 분류된 목록이 남는다.
- **모의면접 SSE 스트리밍의 웹 동작 여부가 명확히 판정된다** — `docs/current_state.md`의 미검증 항목과 `open-questions.md`의 해당 항목이 이 결과로 닫힌다.
- 목록을 사용자에게 보고한 뒤 2단계로 넘어간다 (동작 버그가 나오면 4단계 범위가 정해진다).

### 2. 반응형 앱 셸

`lib/app/widgets/app_shell.dart`의 `AppShell.build()`를 `LayoutBuilder`로 감싸 600dp 기준으로 분기한다.

- **< 600dp**: 현재의 `NavigationBar`(하단) 그대로 — 코드·외형 변경 없음.
- **>= 600dp**: `Scaffold(body: Row([NavigationRail, VerticalDivider, Expanded(본문)]))`, 하단 바 제거. `NavigationRail`의 `selectedIndex`/`onDestinationSelected`는 기존 `navigationShell.currentIndex` / `goBranch(index, initialLocation: ...)`를 그대로 쓴다. 라벨은 `NavigationRailLabelType.all`(아이콘 3개뿐이라 항상 보여도 좁지 않다).
- 본문에 **최대 폭 제한 공통 래퍼**(`Center` + `ConstrainedBox(maxWidth: 840)`)를 셸 한 곳에서 적용한다. 화면마다 따로 넣지 않는다.
- breakpoint 값과 본문 최대 폭은 `lib/app/` 하위 상수 파일(예: `breakpoints.dart`)에 둔다.

**인수 기준**
- Chrome 창 폭을 600dp 경계로 오갈 때 하단 탭 ↔ 좌측 rail이 전환되고, 두 상태 모두에서 탭 전환·브라우저 뒤로가기·URL이 동일하게 동작한다.
- 탭을 전환했다 돌아와도 각 탭의 스크롤/스택 상태가 유지된다(`indexedStack` 동작 보존).
- iOS 시뮬레이터 화면은 작업 전과 픽셀 수준으로 동일하다.
- `flutter analyze` / `flutter test` 통과.

### 3. 레이아웃 결함 화면 대응

1단계에서 `레이아웃만 깨짐`으로 분류된 화면**만** 손댄다. 조사 결과 홈 그리드(`GridView maxCrossAxisExtent: 220`)와 로그인(`ConstrainedBox maxWidth: 360`)은 이미 대응돼 있으므로 **대상에서 제외하고 눈으로 확인만** 한다.

우선 점검 대상 (1단계 결과로 최종 확정):
- `interview_page.dart:452` — 말풍선 폭이 `MediaQuery.of(context).size.width * 0.75`로 **화면 전체 폭** 기준이다. 2단계 본문 래퍼가 들어가면 rail 폭까지 포함해 계산되어 어긋난다. **`LayoutBuilder`/`constraints.maxWidth` 기준으로 바꾼다.** (이번 작업에서 실제로 고칠 가능성이 가장 높은 지점)
- `field_page.dart` — `Row` 2분할이 넓은 화면에서 과도하게 늘어나는지.
- `question_detail_page.dart` — 서술형 본문/답변 입력의 줄 길이(2단계 래퍼로 해소되는지 확인).
- `topic_list_page.dart` / `question_list_page.dart` / `wrong_notes_page.dart` / `me_page.dart` — ListView 항목이 넓은 화면에서 어색한지.
- `resume_page.dart`, `question_review_page.dart` — 텍스트 입력·복습 화면.

**인수 기준**
- 1단계 목록의 `레이아웃만 깨짐` 항목이 전부 해소된다.
- 수정한 화면이 좁은 화면(iOS 시뮬레이터)에서 작업 전과 동일하게 보인다.

### 4. (조건부) 동작 버그 수리

1단계에서 `동작 깨짐`이 나온 항목만 수리한다. 없으면 이 단계는 건너뛴다.

- **SSE 스트리밍이 웹에서 뭉쳐 나올 경우에만** `http_interview_chat_client.dart`를 다룬다. `package:http` 1.6.0은 이미 Fetch 기반이라 이론상 동작해야 하므로, 먼저 **파싱 쪽(`_parseEvent`, `utf8.decoder` 경계 처리)과 Edge Function 응답 헤더**를 의심한다. 패키지 교체(`fetch_client` 등)는 최후 수단이고, 가기 전에 사용자에게 보고한다.
- 그 외 버그(PDF 업로드, OAuth 리다이렉트 복귀 등)는 원인이 웹 전용 제약인지 기존 결함인지 구분해 기록한다. **범위가 반응형 레이아웃을 크게 벗어나면 별도 작업으로 빼자고 제안**한다.

**인수 기준**
- Chrome에서 모의면접 응답이 **청크 단위로 점진 표시**된다 (또는 불가능한 이유와 대안이 문서화된다).
- 발견된 플랫폼별 특이사항이 `CLAUDE.md` Non-Obvious Rules에 한 줄로 추가된다.

### 5. 문서 갱신 + 배포 확인

- `docs/adr.md`: 반응형 결정 ADR 추가 — 600dp 단일 breakpoint, `NavigationRail`, 본문 최대 폭 840dp, `flutter_adaptive_scaffold` 미채택 근거 (ADR-010 후속).
- `docs/roadmap.md`: M6의 "웹 전용 레이아웃" 항목 완료 표기, 나머지 M6 항목(로딩/에러/빈 상태, 오프라인, 접근성)은 그대로 남김.
- `docs/architecture.md`: "모바일 레이아웃 먼저, 웹 전용 레이아웃은 M6" 서술을 구현 결과에 맞게 갱신.
- develop push → Vercel Preview URL에서 1단계 경로를 다시 한 번 확인.

**인수 기준**
- Preview URL의 넓은 화면에서 rail 레이아웃이 보이고, 폭을 줄이면 하단 탭으로 전환된다.
- 문서 3종이 실제 구현과 일치한다.
- `docs/current_state.md`·`docs/work_log.md`는 이 단계에서 수정하지 않는다 (`/wrap`에서 처리).

## 성공 기준

- Chrome 데스크톱에서 전체 여정이 끝까지 동작한다 — 모의면접 스트리밍 포함, 또는 불가 사유가 문서화됨.
- 넓은 화면(≥600dp)에서 NavigationRail + 본문 폭 제한 레이아웃으로 보이고, 좁은 화면은 작업 전과 동일하다.
- 라우트 경로와 탭 상태 보존 동작이 변하지 않았다.
- `flutter analyze` / `flutter test` 통과.
- Vercel Preview에서 동일하게 확인됨.

## 범위 밖 (별도 후속)

- M6 잔여: 로딩·에러·빈 상태 정리, 오프라인 처리, 접근성
- 회원(로그인) 경로 LLM 실호출 검증
- 앱 아이콘 적용
- Apple/Kakao 외부 콘솔 설정 및 실기기 로그인 검증
- M5-b 콘텐츠 파이프라인
