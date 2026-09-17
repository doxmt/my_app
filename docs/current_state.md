# 현재 상태

마지막 갱신: 2026-09-17

## 완료
- Flutter 프로젝트, GitHub 레포(`doxmt/my_app`), Claude Code 하네스, Vercel 웹 배포 + GitHub Actions CI
- M0. 설계 문서화, 데스크톱 플랫폼 폴더 삭제
- M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대 (PR #2)
  - 원격 DB에 12개 테이블 + pgvector + RLS + GRANT 적용 (`supabase/migrations/20260917082153_init_schema.sql`)
  - 앱: Supabase 초기화(publishableKey), 기기 ID, 홈 분야 목록(빈 상태), 하단 탭 3개(홈 `/` · 모의면접 `/interview` · 내 정보 `/me`, `/me/wrong-notes`)
- PR 한글 요약 댓글(CI + Vercel 배포 결과) (PR #4)

## 예정
- M2. 카테고리/문제풀이 + 로컬 오답노트 (`docs/roadmap.md`) — 시작 전 `/plan`에서 `docs/plans/open-questions.md`의 M2 항목("학습하기" 모드 여부, 분야 목록) 결정

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0(init·link 완료), Vercel CLI 59.20.0, iOS 배포 타깃 15.0
- Supabase: ref `bmewpbkllmlikzqkxalw` (Tokyo). 새 테이블 자동 노출 끔 + 자동 RLS → 마이그레이션마다 GRANT·정책 필수. 익명 로그인 꺼짐 확인됨
- 권한 없는 테이블을 publishable key로 조회하면 HTTP 401 + `42501`이 온다 (M1 계획서의 403 표기와 다름)
- 로컬 실행: `flutter run --dart-define-from-file=env/dev.json` (`env/dev.json`은 gitignore, 예시는 `env/dev.json.example`)
- Vercel 환경변수 `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`는 Preview/Production에 등록 완료. Vercel PR 댓글은 꺼져 있고 GitHub Actions가 한글 요약 댓글을 단다
- GitHub 기본 브랜치는 `develop` (Vercel Production 브랜치는 `main`)
- Android는 이 Mac에 에뮬레이터(AVD)가 없어 M1 미확인 — AVD를 만들면 확인 필요
- `profiles` 자동 생성 트리거는 미정 (M4 전 결정, open-questions 참고)
- 구조 스케치: https://claude.ai/artifact/MgDZ3r2UzX3iky8AxuZh5E
