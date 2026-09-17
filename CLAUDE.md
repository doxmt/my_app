# CLAUDE.md

@docs/architecture.md

## Project Context

개발자 기술면접 준비 앱. Flutter 하나로 Android/iOS/Web을 만들고, 백엔드는 Supabase다.
기능: 카테고리별 서술형 문제풀이 + 오답노트, 이력서 기반 AI 모의면접, OAuth 회원가입, 어드민 콘텐츠 파이프라인.
전체 설계 기준 문서는 `docs/overview.md`다. 진행 순서와 현재 위치는 `docs/roadmap.md`, `docs/current_state.md`, 결정 배경은 `docs/adr.md`를 본다.
설계를 바꾸면 `docs/overview.md`와 해당 주제 문서(prd/architecture/adr/roadmap)를 함께 고친다.

## Non-Obvious Rules

- 터미널 멀티플렉서는 tmux가 아닌 **cmux**를 사용한다. tmux 명령어가 필요한 경우 cmux 동등 명령어로 대체하라.
- 개발 순서는 핵심 기능 → OAuth 회원가입(M4) → 어드민(M5)이다. 해당 마일스톤 전에는 로그인 화면이나 어드민 기능을 만들지 않는다.
- 비회원은 로그인(익명 로그인 포함) 없이 쓴다. 비회원의 학습 기록·이력서·면접 대화는 기기에만 저장하고 서버에 두지 않는다.
- 비회원 사용량은 `X-Device-Id` 헤더와 IP 해시로 `guest_daily_usage`에서 센다. 기기 ID는 한도 계산용일 뿐 데이터 조회 키로 쓰지 않는다.
- LLM API 호출과 API 키는 Supabase Edge Function 안에만 둔다. Flutter 코드에서 LLM을 직접 호출하지 않는다.
- LLM 호출은 반드시 `LlmProvider` 어댑터를 거친다. 특정 벤더 SDK를 호출부에서 직접 쓰지 않는다.
- 사용량은 `increment_daily_usage`(회원) / `increment_guest_usage`(비회원) RPC로만 증가시킨다. 한도 숫자는 코드에 하드코딩하지 않고 `rate_limit_config`에서 읽는다.
- Supabase 프로젝트는 새 테이블을 Data API에 자동 노출하지 않고 RLS를 자동으로 켠다. 마이그레이션에 `GRANT`와 RLS 정책(공개 테이블의 select 포함)을 반드시 함께 쓴다.
- `categories`/`questions`는 앱에서 쓰기 불가다. M5 전까지는 SQL 시드로, 이후에는 어드민 승인 흐름으로만 추가한다.
- PDF 텍스트 추출은 클라이언트나 Edge Function에서 하지 않는다 (Vercel Node 함수 담당).
- 어드민(`admin/`)은 Flutter가 아닌 React 웹앱이다.
- 대상 플랫폼은 Android/iOS/Web뿐이다. 데스크톱 플랫폼 폴더를 다시 만들지 않는다.
- 플랫폼별 동작 차이(웹 전용 제약, 플러그인 미지원 등)가 생기면 여기에 추가한다.

## Do Not

> 사용자가 반복 실수나 잘못된 가정을 지적하면, 다음 세션에서 반복하지 않도록 이 섹션에 짧게 추가한다.

- `docs/current_state.md`와 `docs/work_log.md`는 `/wrap`에서만 작성한다. `/plan`·`/start` 중이나 subagent(writer/executor)에게 이 파일 수정을 맡기지 않는다.

## Commands

```bash
flutter run                 # 연결된 디바이스/시뮬레이터에서 실행
flutter run -d chrome       # 웹 브라우저에서 실행
flutter build web           # 웹 배포용 빌드 (결과물: build/web)
flutter build apk           # Android 빌드
flutter build ios           # iOS 빌드 (Xcode 서명 필요)
flutter test                # 테스트 실행
flutter analyze             # 정적 분석
```

## Definition of Done

PR 올리기 전 아래를 모두 통과해야 한다.

- [ ] `flutter analyze` 통과
- [ ] `flutter test` 통과
- [ ] UI 변경 시: 영향받는 플랫폼(Android/iOS/Web)에서 직접 확인

## 브랜치 전략

- 평소 작업은 모두 `develop`에 푸시한다 (`/start`, `/submit`, `/finish` 사이클 기준).
- `main`은 릴리즈 시점에만 한 번 푸시한다.

## 커밋 메세지 규칙

Conventional Commits 형식을 따른다.

예시: `feat: 로그인 폼 유효성 검사 추가`
