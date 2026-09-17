# Open Questions

## M1 Supabase 스키마 + 앱 골격 - 2026-09-17

- [x] 내비게이션 구조 — 하단 탭 3개(홈 · 모의면접 · 내 정보), 오답노트는 내 정보 안으로 확정 (ADR-010)
- [ ] `profiles` 자동 생성 트리거(`auth.users` insert 시 행 생성)를 M1 마이그레이션에 넣을지, M4로 미룰지 정한다. — M1에는 로그인이 없어 당장 필요하지 않지만, `question_candidates`의 admin 정책이 `profiles.is_admin`을 참조한다.
- [x] Supabase 대시보드에서 Anonymous sign-ins가 꺼져 있는지 확인한다. (2026-09-17 Management API로 `external_anonymous_users_enabled: false` 확인) — 비회원은 로그인 없이 쓴다는 원칙(익명 로그인 금지)을 설정에서도 막아야 한다.
- [ ] `supabase init`이 기존 link 정보(`.temp/linked-project.json`)를 보존하는지, `supabase/.gitignore`를 생성하는지 확인한다. — 구현 1단계 시작 시 확인하고, link가 풀렸으면 다시 연결해야 한다.
- [ ] Vercel SPA rewrite 문법(`{"source": "/(.*)", "destination": "/index.html"}`)을 공식 문서에서 확인한다. — 1차 소스를 직접 확인하지 못했다. 틀리면 웹에서 직접 접속할 때 404가 난다.

## M2 문제풀이 - 2026-09-17

- [ ] "학습하기" 모드(문제와 모범답안을 바로 보기)를 넣을지 정한다. — 구조 스케치에는 분야 → 학습하기/문제풀기/랜덤 학습/랜덤 문제풀기 → 주제 흐름이 있지만 PRD에는 문제풀기만 있다. 넣으면 PRD와 M2 범위를 고친다.
- [ ] 분야(최상위 카테고리) 목록 확정 — 스케치 예시는 CS, 프론트엔드, 백엔드, AI, 모바일, DevOps. M2 시드 작성 시 정한다.
