# 작업 로그

## 2026-09-17
- Flutter 프로젝트 생성, 웹 빌드 오류(Gatekeeper 격리, dart-sdk 캐시 누락) 해결
- GitHub 비공개 레포 생성, `develop` 브랜치 전략 적용
- Claude Code 하네스 적용 및 트리밍 (analyst, test-engineer, 훅, 코드리뷰 커맨드 제외)
- Vercel 연결 + `vercel.json` 커스텀 빌드, GitHub Actions CI 추가
- 전체 제품 설계 확정 (Supabase, Riverpod, go_router, LLM 어댑터, 로그인 없는 비회원 + 기기 ID/IP 한도, 콘텐츠 파이프라인)
- M0: 안 쓰는 데스크톱 플랫폼 폴더 삭제, 프로젝트 문서 작성

### 주요 변경 파일
- `CLAUDE.md`
- `docs/prd.md`, `docs/architecture.md`, `docs/adr.md`, `docs/roadmap.md`, `docs/current_state.md`
- `vercel.json`, `.github/workflows/ci.yml`
- `macos/`, `linux/`, `windows/` (삭제)
