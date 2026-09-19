# 현재 상태

마지막 갱신: 2026-09-18

## 완료
- Flutter 프로젝트, GitHub 레포(`doxmt/my_app`), Claude Code 하네스, Vercel 웹 배포 + GitHub Actions CI
- M0. 설계 문서화, 데스크톱 플랫폼 폴더 삭제
- M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대 (PR #2)
- M2. 카테고리/문제풀이 + 로컬 오답노트 (PR #7, 머지 완료)
- M3. 이력서 입력 + 모의면접 (비회원) — PR #10으로 머지 완료
- M4. OAuth 회원가입 (Google + GitHub) — 구현 완료, PR #12(`Closes #11`) 생성됨, 아직 머지 전
  - `profiles` 자동 생성 트리거, `increment_daily_usage` RPC, `free=12`/`guest_device=3` 한도, `wrong_notes.resolved_at` 컬럼
  - `lib/features/auth/`(Google 네이티브+웹 리다이렉트 분기, GitHub 리다이렉트), 로그인 시 오답노트+이력서 자동 이전(면접 대화는 제외)
  - 오답노트·이력서 리포지토리를 로그인 여부로 분기, `interview-chat` 회원 경로(JWT 검증, DB 이력 기준 프롬프트, `interview_messages` 저장)
  - `flutter analyze`/`flutter test`/`deno test` 전부 통과, 원격 마이그레이션 적용 및 curl 종단 검증 완료
  - 계획: `docs/plans/m4-oauth-signup.md`, 결정: `docs/adr.md` ADR-014, ADR-015

## 예정
- PR #12 CI 확인 → 머지 → `git pull origin develop`
- **PR #12 관련 수동 검증 필요**: Google Cloud Console/GitHub OAuth App 등록, Supabase 대시보드 provider·Redirect URL 설정, iOS 시뮬레이터·Web에서 실제 로그인 → 데이터 이전 → 로그아웃 흐름 직접 탭 확인, iOS/Android 네이티브 URL scheme(딥링크) 등록(bundle id 확정 후)
- **알려진 스코프 단순화**: `interview-chat` 회원 세션이 완료(completed) 상태로 전환되지 않고 항상 기존 active 세션에 이어붙임 — 후속 작업 필요 여부 논의 필요
- M3/M4 LLM 실호출 검증 후속 작업: API 키 확보 후 Anthropic/OpenAI 실제 호출 + iOS 종단 스트리밍 검증(비회원·회원 경로 모두) (`docs/plans/open-questions.md` 참고)
- Apple/Kakao OAuth 제공자 추가 시점 미정 (Apple은 앱스토어 출시 전 사실상 필수, 유료 개발자 계정 선행 필요)
- 사용자 피드백: 홈 분야 목록을 카드형 UI(아이콘/이미지)로 바꾸고 싶어함 — 처리 시점(M2 후속 vs M6) 미정
- iOS 시뮬레이터로 M2 드릴다운 화면(문제풀이 → 오답노트) 전체 여정 재확인 필요
- Android는 이 Mac에 AVD가 없어 여전히 미확인
- M5. 어드민 페이지 + 콘텐츠 자동화 — `docs/roadmap.md` 참고, 시작 전 `/plan` 필요

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0, Vercel CLI 59.20.0(59.23.1로 업그레이드 권장), iOS 배포 타깃 15.0
- Supabase: ref `bmewpbkllmlikzqkxalw` (Tokyo). 새 테이블 자동 노출 끔 + 자동 RLS → 마이그레이션마다 GRANT·정책 필수
- **postgrest Dart 클라이언트의 `.order()`는 `ascending` 기본값이 `false`**(SQL/REST 기본과 반대) — 정렬이 필요한 모든 쿼리에 `ascending: true`(또는 의도한 값)를 명시해야 함
- **`google_sign_in` 7.2.0은 싱글턴(`GoogleSignIn.instance`) + `initialize()` 필수**, 인증/인가가 분리된 단계 — Supabase 공식 문서가 7.x 출시 후 한동안 outdated였다는 신고(GitHub 이슈 `supabase/supabase#36775`)가 있었지만 실제 배포본 기준으로 재확인 후 구현함 (M4에서 확인)
- **회원/비회원 리포지토리 분기는 `Session` 객체가 아니라 `currentUserIdProvider`(`String? userId`만 watch)로 한다** — `Session`을 watch하면 토큰 갱신(약 1시간 주기)마다 리포지토리 provider가 rebuild되어 목록이 깜빡인다 (M4에서 확인)
- 로그인 성공 시 로컬→DB 데이터 이전이 끝날 때까지 `currentUserIdProvider`가 null을 유지해, 화면이 이전 도중 회원 리포지토리로 전환되지 않게 한다 (M4)
- `functions.invoke`는 스트리밍 응답을 지원하지 않음 → Edge Function을 스트리밍으로 쓰려면 `package:http`로 Function URL 직접 호출 (ADR-013)
- 로컬 실행: `flutter run --dart-define-from-file=env/dev.json`
- GitHub 기본 브랜치는 `develop` (Vercel Production 브랜치는 `main`)
- 구조 스케치: https://claude.ai/artifact/MgDZ3r2UzX3iky8AxuZh5E
