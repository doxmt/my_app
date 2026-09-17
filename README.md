# my_app

개발자 기술면접 준비 앱 (Android / iOS / Web).

- 카테고리별 서술형 문제풀이 + 오답노트
- 이력서 기반 AI 모의면접
- OAuth 회원가입 (Google / Apple / GitHub / Kakao)

## 스택

Flutter · Riverpod · go_router · Supabase · Anthropic/OpenAI · Vercel

## 실행

```bash
flutter pub get
flutter run                # 모바일
flutter run -d chrome      # 웹
```

## 배포

- `develop` push → Vercel Preview, `main` push → Vercel Production
- push/PR마다 GitHub Actions에서 `flutter analyze`, `flutter test` 실행

## 문서

- `docs/prd.md` — 제품 요구사항
- `docs/architecture.md` — 구조와 데이터 모델
- `docs/adr.md` — 기술 결정 기록
- `docs/roadmap.md` — 마일스톤
- `docs/current_state.md` — 현재 진행 상태
