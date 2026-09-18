# 로드맵

핵심 학습/면접 기능을 먼저 만들고, 회원가입과 어드민은 마지막에 한다 (ADR-007).
각 마일스톤은 `/plan`으로 `docs/plans/{task}.md`를 만든 뒤 `/start` → `/submit` → `/finish`로 진행한다.

## M0. 정리 + 문서화
- 안 쓰는 `macos/`, `linux/`, `windows/` 폴더 삭제
- `CLAUDE.md`, `docs/prd.md`, `docs/architecture.md`, `docs/adr.md`, `docs/roadmap.md` 작성

## M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대
- `supabase init`/`link`, `supabase/migrations/`에 스키마·RLS·GRANT 작성 및 적용 (pgvector 확장 포함, 전체 12개 테이블)
- 로그인 없음 (OAuth는 M4)
- `supabase_flutter`, `flutter_riverpod`, `go_router` 추가, `main.dart`를 Supabase 초기화 + `ProviderScope` + `MaterialApp.router`로 교체
- 최초 실행 시 기기 ID 생성·보관
- Supabase URL/publishable key는 `String.fromEnvironment`로 읽음 (로컬은 `--dart-define-from-file=env/dev.json`, Vercel은 환경변수로 `--dart-define` 전달)
- 하단 탭 3개: 홈(`/`, 분야 목록) · 모의면접(`/interview`) · 내 정보(`/me`, 오답노트는 `/me/wrong-notes`). 홈 외에는 빈 화면
- 화면은 모바일 레이아웃 기준. 웹은 빌드·배포·path URL만 유지하고 웹 전용 레이아웃은 M6
- 완료 기준: 세 플랫폼에서 앱이 뜨고, 로그인 없이 카테고리 목록이 Supabase에서 조회됨(빈 상태 포함)

## M2. 카테고리/문제풀이 + 로컬 오답노트
- SQL 시드 스크립트로 테스트용 카테고리·문제 삽입: CS · 프론트엔드 2개 분야, 각 분야 주제 2개 × 문제 3개(서술형만, 총 12문제)
- 홈 분야 선택 → 분야 화면 → 학습하기/문제풀기 선택 → 주제(하위 카테고리) → 문제 목록 → 문제 상세
  - **학습하기**: 문제와 모범답안을 바로 보는 읽기 전용 모드
  - **문제풀기**: 답변 작성 → 모범답안 보기 → 정답/오답 자가 채점
- "오답노트에 저장" 버튼, 오답노트 목록·해결 처리 — 전부 기기 로컬 저장 (`shared_preferences` + JSON)
- 답변 시도 기록(연습 이력)은 저장하지 않음
- 완료 기준: 로그인 없이 학습하기/문제풀이와 오답노트가 앱 재시작 후에도 유지됨

## M3. 이력서 입력 + 모의면접 (비회원)
- 이력서 텍스트 붙여넣기(우선), PDF → Vercel 파싱 함수(크기·호출 제한 포함) → 텍스트 반환
- 이력서·면접 대화를 기기에 저장
- `interview-chat` Edge Function: LLM 어댑터 2종, 요청 본문의 이력서·대화로 프롬프트 구성, 대화 길이 제한, 스트리밍
- `increment_guest_usage` RPC 추가 (기기 ID + IP 해시)
- `rate_limit_config` 초기값 삽입 (`guest_device`, `guest_ip` 한도)
- 채팅 UI (스트리밍 말풍선, 남은 사용량 배너, 한도 초과 안내)
- 완료 기준:
  - 로그인 없이 이력서 입력(텍스트/PDF) → 분야·직무 선택 → 채팅 UI에서 메시지 전송·기기 저장까지 iOS 시뮬레이터에서 동작
  - 기기 한도·IP 한도 초과 시 각각 429 안내
  - Anthropic/OpenAI 어댑터가 `LlmProvider` 인터페이스로 구현되고 `factory.ts`가 `LLM_PROVIDER` 값에 따라 올바른 어댑터를 선택하며, 벤더별 요청 형식·스트리밍 이벤트 파싱은 단위 테스트로 검증됨
  - 실제 벤더 API 호출을 통한 종단 스트리밍 검증(iOS에서 실제 LLM 응답으로 면접 대화)은 API 키 확보 후 별도 후속 작업

## M4. OAuth 회원가입
- Supabase Auth에 Google/Apple/GitHub/Kakao 설정
- 로그인 화면 (`google_sign_in`, `sign_in_with_apple`, GitHub/Kakao는 `signInWithOAuth`)
- 기기의 학습 기록·오답노트·이력서·면접 대화 → DB 업로드 (중복 방지), 이후 회원 데이터는 DB 기준
- `increment_daily_usage` RPC 추가 (M3의 `increment_guest_usage`와 별개)
- `interview-chat`에 회원 경로 추가 (JWT, `increment_daily_usage`, DB 이력 사용, `interview_messages` 저장)
- 회원은 `free` 한도 적용
- 완료 기준: 비회원 때 쌓은 기록이 가입 후 계정에 남아 있고, 다른 계정 데이터는 보이지 않음

## M5. 어드민 페이지 + 콘텐츠 자동화
- React 어드민 웹앱 (`admin/`), 별도 Vercel 배포, `is_admin` 확인
- `content-pipeline`: 자료 입력 → LLM 문제 초안 → 임베딩 → 중복 비교 → `question_candidates`
- 후보 목록(중복 의심 표시), 수정·승인·반려 → 승인 시 `questions`에 게시
- 같은 파이프라인을 커맨드로도 실행 가능하게
- 완료 기준: 중복 후보에 `duplicate_of`가 채워지고, 승인한 문제가 앱에 바로 보임

## M6. 폴리시/QA
- 로딩·에러·빈 상태 정리, 오프라인 처리, 접근성
- 웹 전용 레이아웃: 넓은 화면에서 NavigationRail, 본문 폭 제한 등 (ADR-010)
- Android/iOS/Web 전체 여정 점검 (`CLAUDE.md` Definition of Done)
- 발견한 플랫폼별 특이사항을 `CLAUDE.md` Non-Obvious Rules에 기록
- 릴리즈 시 `main`에 push → Production 배포
