# 현재 상태

마지막 갱신: 2026-09-18

## 완료
- Flutter 프로젝트, GitHub 레포(`doxmt/my_app`), Claude Code 하네스, Vercel 웹 배포 + GitHub Actions CI
- M0. 설계 문서화, 데스크톱 플랫폼 폴더 삭제
- M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대 (PR #2)
- PR 한글 요약 댓글(CI + Vercel 배포 결과) (PR #4)
- M2. 카테고리/문제풀이 + 로컬 오답노트 — 구현 완료, PR #7 (`Closes #6`) 생성됨, 아직 머지 전
  - CS·프론트엔드 2개 분야 시드(주제2×문제3, 서술형), 학습하기/문제풀기 2갈래, 로컬 오답노트(`SharedPreferencesAsync`)
  - 계획: `docs/plans/m2-practice-wrong-notes.md`, 결정: `docs/adr.md` ADR-012

## 예정
- PR #7 CI 확인 → 머지 → `git pull origin develop`
- 사용자 피드백: 홈 분야 목록을 카드형 UI(아이콘/이미지)로 바꾸고 싶어함 — 처리 시점(M2 후속 vs M6) 미정, 다음 세션에서 결정 필요
- iOS 시뮬레이터로 드릴다운 화면(문제풀이 → 오답노트)까지 전체 여정 재확인 필요 (이번 세션엔 홈 화면만 확인함)
- Android는 이 Mac에 AVD가 없어 여전히 미확인
- M3. 이력서 입력 + 모의면접 (비회원) — `docs/roadmap.md` 참고, 시작 전 `/plan` 필요

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0, Vercel CLI 59.20.0, iOS 배포 타깃 15.0
- Supabase: ref `bmewpbkllmlikzqkxalw` (Tokyo). 새 테이블 자동 노출 끔 + 자동 RLS → 마이그레이션마다 GRANT·정책 필수
- **postgrest Dart 클라이언트의 `.order()`는 `ascending` 기본값이 `false`**(SQL/REST 기본과 반대) — 정렬이 필요한 모든 쿼리에 `ascending: true`를 명시해야 함 (M2에서 발견, 기존 M1 코드도 수정함)
- 로컬 실행: `flutter run --dart-define-from-file=env/dev.json`
- GitHub 기본 브랜치는 `develop` (Vercel Production 브랜치는 `main`)
- `profiles` 자동 생성 트리거는 미정 (M4 전 결정, open-questions 참고)
- 구조 스케치: https://claude.ai/artifact/MgDZ3r2UzX3iky8AxuZh5E
