# 현재 상태

마지막 갱신: 2026-09-20

## 완료
- Flutter 프로젝트, GitHub 레포(`doxmt/my_app`), Claude Code 하네스, Vercel 웹 배포 + GitHub Actions CI
- M0. 설계 문서화, 데스크톱 플랫폼 폴더 삭제
- M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대 (PR #2)
- M2. 카테고리/문제풀이 + 로컬 오답노트 (PR #7, 머지 완료)
- M3. 이력서 입력 + 모의면접 (비회원) — PR #10으로 머지 완료
- M4. OAuth 회원가입 (Google + GitHub) — PR #12 머지 완료
- M5-a. 어드민 웹앱 + 콘텐츠 관리 — 구현 완료, PR #15(`Closes #13`) 생성됨, 아직 머지 전
  - `admin/`(Vite+React+TS+Tailwind v4+shadcn/ui): 비밀번호 전용 로그인(고정 관리자 계정), 카테고리 관리, 공유 문제 에디터(직접 작성/후보 승인/반려), 문제 목록(게시 토글)
  - `categories`/`questions` 어드민 쓰기·미게시 조회 RLS+GRANT, `approve_question_candidate` RPC — 원격 적용 및 anon 키로 거부 확인 완료
  - CI에 admin lint+build 스텝 추가, `flutter analyze`/`flutter test`(45개) 전부 통과(앱 코드 무변경)
  - 계획: `docs/plans/m5a-admin-console.md`, 결정: `docs/adr.md` ADR-016, ADR-017
  - M5-b(`content-pipeline`, LLM 초안+임베딩 중복비교)는 API 키 확보 후 별도 작업

## 예정
- PR #15 CI 확인 → 머지 → `git pull origin develop`
- **M5-a 관련 수동 작업 필요**: Supabase 대시보드에서 관리자 계정 생성 + `profiles.is_admin=true`, `admin/.env`의 `VITE_ADMIN_EMAIL` 실제 값 교체, Vercel Dashboard에서 레포 재Import(Root Directory=`admin/`)로 새 프로젝트 생성 + 환경변수 설정 + 양쪽 프로젝트 Ignored Build Step 설정, 배포 후 실제 로그인→콘텐츠 생성→Flutter 앱 노출 E2E 확인
- 이슈 #14(`fix: 로그인 화면 버튼 정렬`) — `fix/14-login-align` 브랜치에 로컬 커밋만 있고 아직 push/PR 안 함
- M5-a Open Questions(`docs/plans/open-questions.md` "M5-a 어드민 웹앱" 섹션): Vercel Password Protection 추가 여부, 어드민 직접 작성 문제의 embedding 백필(M5-b 몫), 더미 후보 SQL 커밋 여부, 문제/카테고리 삭제 정책, 이메일 가입 경로 잠금 여부, 어드민 검색/필터 시점
- M5-b(`content-pipeline`) 착수 조건인 LLM/임베딩 API 키 확보 — 시점 미정. 확보되면 M3/M4 LLM 실호출 검증(비회원·회원 경로)도 같이 처리 고려
- PR #12(M4) 관련 수동 검증 여전히 미완료: Google Cloud Console/GitHub OAuth App 등록, Supabase 대시보드 provider·Redirect URL 설정, iOS 시뮬레이터·Web 실제 로그인→데이터 이전→로그아웃 확인, iOS/Android 딥링크 등록
- `interview-chat` 회원 세션이 completed로 전환되지 않고 항상 기존 active 세션에 이어붙임 — 후속 작업 필요 여부 논의 필요
- Apple/Kakao OAuth 제공자 추가 시점 미정
- 사용자 피드백: 홈 분야 목록을 카드형 UI(아이콘/이미지)로 바꾸고 싶어함 — 처리 시점 미정
- iOS 시뮬레이터로 M2 드릴다운 화면(문제풀이 → 오답노트) 전체 여정 재확인 필요
- Android는 이 Mac에 AVD가 없어 여전히 미확인

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0, Vercel CLI 59.20.0(59.23.2로 업그레이드 권장), iOS 배포 타깃 15.0, Node 22(admin CI)
- Supabase: ref `bmewpbkllmlikzqkxalw` (Tokyo). 새 테이블 자동 노출 끔 + 자동 RLS → 마이그레이션마다 GRANT·정책 필수
- **postgrest Dart 클라이언트의 `.order()`는 `ascending` 기본값이 `false`**(SQL/REST 기본과 반대) — 정렬이 필요한 모든 쿼리에 `ascending: true`(또는 의도한 값)를 명시해야 함
- 어드민 승인 RPC(`approve_question_candidate`)는 어드민 웹앱이 `authenticated`로 직접 호출하므로, `service_role` 전용인 `increment_daily_usage`/`increment_guest_usage`와 달리 **함수 내부에서 `profiles.is_admin`을 확인**한다 (M5-a에서 확인)
- 마이그레이션 파일명은 `YYYYMMDDHHMMSS_snake_case_description.sql` 형식, 타임스탬프는 항상 마지막 파일보다 커야 함
- **회원/비회원 리포지토리 분기는 `Session` 객체가 아니라 `currentUserIdProvider`(`String? userId`만 watch)로 한다** — `Session`을 watch하면 토큰 갱신(약 1시간 주기)마다 리포지토리 provider가 rebuild되어 목록이 깜빡인다 (M4에서 확인)
- `functions.invoke`는 스트리밍 응답을 지원하지 않음 → Edge Function을 스트리밍으로 쓰려면 `package:http`로 Function URL 직접 호출 (ADR-013)
- 로컬 실행: `flutter run --dart-define-from-file=env/dev.json`
- 어드민 로컬 실행: `cd admin && npm run dev` (`admin/.env` 필요, `.env.example` 참고)
- GitHub 기본 브랜치는 `develop` (Vercel Production 브랜치는 `main`)
- 구조 스케치: https://claude.ai/artifact/MgDZ3r2UzX3iky8AxuZh5E
