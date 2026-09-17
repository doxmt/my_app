# 현재 상태

마지막 갱신: 2026-09-17

## 완료
- Flutter 프로젝트 생성, GitHub 비공개 레포(`doxmt/my_app`) 연결, `develop` 브랜치 사용
- Claude Code 하네스 적용 (커맨드 5개, 에이전트 6개, github 스킬)
- Vercel 웹 자동 배포(`vercel.json`) + GitHub Actions CI(`flutter analyze`/`flutter test`) 설정
- 전체 설계 확정 및 문서화 (M0): `docs/prd.md`, `architecture.md`, `adr.md`, `roadmap.md`, `CLAUDE.md`
- 안 쓰는 `macos/`, `linux/`, `windows/` 폴더 삭제

## 예정
- M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대 (`docs/roadmap.md` 참고)

## 참고사항
- Supabase 프로젝트 생성 완료: ref `bmewpbkllmlikzqkxalw` (Tokyo), URL `https://bmewpbkllmlikzqkxalw.supabase.co`, publishable key는 대시보드 또는 `supabase projects api-keys --project-ref bmewpbkllmlikzqkxalw`로 확인
- Supabase 설정: Data API 켬, 새 테이블 자동 노출 끔(테이블별 GRANT 필요), 자동 RLS 켬(공개 테이블도 select 정책 필요)
- Supabase CLI는 로그인되어 있으나 아직 `supabase init`/`supabase link` 전이다
- 비회원은 익명 로그인 없이 바로 사용하도록 설계 변경됨 (ADR-003): 데이터는 기기에만, 한도는 기기 ID + IP
- OAuth 회원가입(M4)과 어드민 페이지(M5)는 핵심 기능 이후에 진행한다
- `lib/main.dart`는 아직 기본 카운터 템플릿이다
