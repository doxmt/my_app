# 로드맵

핵심 학습/면접 기능을 먼저 만들고, 회원가입과 어드민은 마지막에 한다 (ADR-007).
각 마일스톤은 `/plan`으로 `docs/plans/{task}.md`를 만든 뒤 `/start` → `/submit` → `/finish`로 진행한다.

## M0. 정리 + 문서화
- 안 쓰는 `macos/`, `linux/`, `windows/` 폴더 삭제
- `CLAUDE.md`, `docs/prd.md`, `docs/architecture.md`, `docs/adr.md`, `docs/roadmap.md` 작성

## M1. Supabase 세팅 + 익명 인증 + 내비게이션 뼈대
- Supabase 프로젝트 생성, `supabase/migrations/`에 스키마·RLS 작성 및 적용 (pgvector 확장 포함)
- 익명 로그인만 활성화 (OAuth는 M4)
- `supabase_flutter`, `flutter_riverpod`, `go_router` 추가, `main.dart`를 Supabase 초기화 + `ProviderScope` + `MaterialApp.router`로 교체
- 기본 라우트(`/`, `/categories`, `/wrong-notes`, `/interview`)와 빈 화면
- 완료 기준: 세 플랫폼에서 앱이 뜨고, 카테고리 목록이 Supabase에서 조회됨(빈 상태 포함)

## M2. 카테고리/문제풀이 + 로컬 오답노트
- SQL 시드 스크립트로 테스트용 카테고리·문제 삽입
- 카테고리 → 하위 카테고리 → 문제 목록 → 문제 상세
- 답변 작성 → 모범답안 보기 → 정답/오답 자가 채점
- "오답노트에 저장" 버튼, 오답노트 목록·해결 처리 — 전부 기기 로컬 저장
- 완료 기준: 로그인 없이 문제풀이와 오답노트가 앱 재시작 후에도 유지됨

## M3. 이력서 업로드 + 모의면접 (익명 사용자)
- 모의면접 진입 시 `signInAnonymously()`
- 이력서 텍스트 붙여넣기(우선), PDF 업로드 + Vercel 파싱 함수
- `interview-chat` Edge Function: LLM 어댑터 2종, 프롬프트 구성, 스트리밍
- `increment_daily_usage` RPC, `rate_limit_config` 초기값
- 채팅 UI (스트리밍 말풍선, 남은 사용량 배너, 한도 초과 안내)
- 완료 기준: 이력서 내용을 참고한 면접 대화가 되고, 한도 초과 시 429 안내가 뜸. `LLM_PROVIDER` 변경으로 제공자 전환됨

## M4. OAuth 회원가입
- Supabase Auth에 Google/Apple/GitHub/Kakao 설정
- 로그인 화면 (`google_sign_in`, `sign_in_with_apple`, GitHub/Kakao는 `signInWithOAuth`)
- `linkIdentity`로 익명 계정 승격
- 로컬 학습 기록 → `practice_attempts`/`wrong_notes` 업로드 (중복 방지)
- 회원은 `free` tier 한도 적용
- 완료 기준: 익명 상태의 이력서·대화·학습 기록이 가입 후에도 남아 있고, 다른 계정 데이터는 보이지 않음

## M5. 어드민 페이지 + 콘텐츠 자동화
- React 어드민 웹앱 (`admin/`), 별도 Vercel 배포, `is_admin` 확인
- `content-pipeline`: 자료 입력 → LLM 문제 초안 → 임베딩 → 중복 비교 → `question_candidates`
- 후보 목록(중복 의심 표시), 수정·승인·반려 → 승인 시 `questions`에 게시
- 같은 파이프라인을 커맨드로도 실행 가능하게
- 완료 기준: 중복 후보에 `duplicate_of`가 채워지고, 승인한 문제가 앱에 바로 보임

## M6. 폴리시/QA
- 로딩·에러·빈 상태 정리, 오프라인 처리, 접근성
- Android/iOS/Web 전체 여정 점검 (`CLAUDE.md` Definition of Done)
- 발견한 플랫폼별 특이사항을 `CLAUDE.md` Non-Obvious Rules에 기록
- 릴리즈 시 `main`에 push → Production 배포
