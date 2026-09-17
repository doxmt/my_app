# CLAUDE.md

@docs/architecture.md

## Harness Template Note

이 파일과 `docs/architecture.md`, `docs/prd.md`, `docs/adr.md`는 새 프로젝트 초기화용 템플릿이다.
프로젝트를 시작할 때 이 하네스를 불러온 뒤, 플랜모드에서 확정된 계획을 바탕으로 중괄호 플레이스홀더를 채운다.
하네스 배포본에서는 플레이스홀더가 비어 있는 것이 정상이다.

## Project Context

Flutter로 Android/iOS 앱을 개발하고, 같은 코드베이스를 웹(`flutter build web`)으로도 배포한다.
아직 초기 세팅 단계이며 구체적인 기능/화면 설계는 `/plan`으로 확정한다.

## Non-Obvious Rules

- 터미널 멀티플렉서는 tmux가 아닌 **cmux**를 사용한다. tmux 명령어가 필요한 경우 cmux 동등 명령어로 대체하라.
- 플랫폼별 동작 차이(웹 전용 제약, 플러그인 미지원 등)가 생기면 여기에 추가한다.

## Do Not

> 사용자가 반복 실수나 잘못된 가정을 지적하면, 다음 세션에서 반복하지 않도록 이 섹션에 짧게 추가한다.

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
