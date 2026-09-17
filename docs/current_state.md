# 현재 상태

마지막 갱신: 2026-09-17

## 완료
- Flutter 프로젝트 생성, GitHub 비공개 레포(`doxmt/my_app`) 연결, `develop` 브랜치 사용
- Claude Code 하네스 적용 (커맨드 5개, 에이전트 6개, github 스킬)
- Vercel 웹 자동 배포(`vercel.json`) + GitHub Actions CI(`flutter analyze`/`flutter test`) 설정
- 전체 설계 확정 및 문서화 (M0): `docs/prd.md`, `architecture.md`, `adr.md`, `roadmap.md`, `CLAUDE.md`
- 안 쓰는 `macos/`, `linux/`, `windows/` 폴더 삭제

## 예정
- M1. Supabase 세팅 + 익명 인증 + 내비게이션 뼈대 (`docs/roadmap.md` 참고)

## 참고사항
- M1 시작 전에 Supabase 프로젝트를 만들어야 한다 (URL, anon key 필요)
- OAuth 회원가입(M4)과 어드민 페이지(M5)는 핵심 기능 이후에 진행한다
- `lib/main.dart`는 아직 기본 카운터 템플릿이다
