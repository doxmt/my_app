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
- 화면은 모바일 레이아웃 기준. 웹은 빌드·배포·path URL만 유지하고 웹 전용 레이아웃은 M6(Next.js 웹 전환으로 흡수, ADR-019)
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

## M4. OAuth 회원가입 (Google + GitHub)
- Supabase Auth에 **Google / GitHub** 설정
- 로그인 화면 — Google: Android/iOS는 네이티브 `google_sign_in` + `signInWithIdToken()`, Web은 `signInWithOAuth()` 리다이렉트 / GitHub: 전 플랫폼 `signInWithOAuth()` 리다이렉트
- 기기의 **오답노트·이력서만 DB로 업로드** (자동, 확인 화면 없음) — 면접 대화는 제외 (재현 가치 대비 작업량 크다)
- 업로드 정책: 오답노트는 `unique(user_id, question_id)` 기준 중복 무시 병합, 이력서는 서버 우선(기존이면 업로드 안 함), 성공한 항목만 로컬 삭제(실패 시 로컬 보존 후 재시도 가능)
- `increment_daily_usage` RPC 추가 (M3의 `increment_guest_usage`와 별개)
- `interview-chat`에 회원 경로 추가 (JWT, `increment_daily_usage`, DB 이력 사용, `interview_messages` 저장)
- 회원은 `free` 한도 적용
- 완료 기준: 비회원 때 쌓은 오답노트·이력서가 가입 후 계정에 남아 있고, 다른 계정 데이터는 보이지 않음

## M4 이후 후속: Apple/Kakao OAuth 추가 + 홈 카드 아이콘 구현 + 딥링크 등록
> 2026-10-01: Apple 로그인은 제거했다(카카오·구글·깃허브 3개, ADR-022). 아래 Apple 항목은 이력으로 남긴다. 앱스토어 출시 시 Apple 로그인(가이드라인 4.8)이 다시 필요할 수 있다.
- **Apple 로그인** (M4의 Google/GitHub에 추가)
  - iOS: 네이티브 `sign_in_with_apple` SDK로 ID 토큰 + nonce → `signInWithIdToken()`
  - Web/Android: Supabase `signInWithOAuth(OAuthProvider.apple)` 리다이렉트
  - Services ID와 .p8 키 파일 확보 필요 (Apple Developer Program)
  - Client secret JWT는 6개월 주기 갱신
- **Kakao 로그인** (전 플랫폼 통일)
  - 네이티브 SDK 미사용, 전 플랫폼 `signInWithOAuth(OAuthProvider.kakao)` 리다이렉트
  - 이메일 동의항목이 Biz App 전용이므로 **현재는 이메일 없이 가입 허용** (Supabase 설정)
  - 최종 확정은 출시 후 사용자 데이터로 재검토
- **홈 분야 카드 UI**
  - 각 분야 카드의 아이콘: `category.slug` → `IconData` 매핑 (DB 컬럼 추가 없음)
  - 분야 추가 시마다 앱 코드 매핑 업데이트 후 배포 필요
  - 트레이드오프: 분야를 어드민이 자유롭게 추가할 수 없음 (개발팀 배포 필요)
- **딥링크 등록**
  - iOS: `CFBundleURLTypes`에 커스텀 스킴 등록 (확정 전)
  - Android: intent-filter에 커스텀 스킴 등록 (확정 전)
  - 스킴 값(reverse-domain 형식)은 이번 작업(Apple/Kakao 로그인) 계획 단계에서 확정
- **LLM API 키 연결**
  - LLM 키는 Supabase secrets에만 저장 (`supabase secrets set`)
  - `LLM_PROVIDER`/`LLM_MODEL` env var 사용
  - 웹 버전에서 모의면접 화면 간단히 확인 가능하게 (구체 범위는 계획에서 확정)
- 완료 기준: Apple/Kakao 로그인이 동작하고, 홈 화면에 분야 아이콘이 표시되며, 딥링크로 앱 호출 가능, LLM 어댑터가 실제 API 키로 스트리밍 응답

## M5-a. 어드민 웹앱 + 수동 콘텐츠 관리
- Vite + React + TypeScript 초기화, Tailwind v4 + shadcn/ui, 경로 별칭 `@/*` 설정
- 비밀번호 전용 로그인: env var의 고정 이메일 + 입력한 비밀번호 → `signInWithPassword`
- 카테고리 관리: 분야/주제 2단계 트리, 추가·수정 화면
- 공유 문제 에디터 폼: 필드(`type`, `prompt`, `model_answer`, 카테고리, `difficulty`, `tags`) → 직접 작성(신규) 또는 후보 승인 두 경로 공유
- 마이그레이션: `categories`/`questions` insert·update 권한 + 미게시 문제 select 정책, `question_candidates`는 기존 정책 유지
- Vercel: 같은 레포 다시 Import, Root Directory `admin/`, 양쪽에 Ignored Build Step 설정
- 완료 기준: SQL 없이 어드민에서 분야·주제·문제를 만들어 게시하면 앱에 즉시 보임

## M5-b. 콘텐츠 파이프라인 (LLM + 임베딩)
- **착수 조건**: LLM/임베딩 API 키 확보
- `content-pipeline` Edge Function: 자료 입력 → LLM 문제 초안 → 임베딩 → 중복 비교 → `question_candidates(pending)`
- 후보 목록(중복 의심 표시), 수정·승인·반려 → 승인 시 `questions`에 게시 (M5-a의 승인 UI 재사용)
- 같은 파이프라인을 커맨드로도 실행 가능하게
- 완료 기준: 중복 후보에 `duplicate_of`가 채워지고, 승인한 문제가 앱에 바로 보임

## M6. Next.js 웹 전환
- 웹 클라이언트를 Flutter 웹에서 `webapp/`의 Next.js 16 앱으로 교체 (ADR-019). Android/iOS는 Flutter 유지. 계획: `docs/plans/nextjs-web.md`
- 전 기능 동등: 문제풀이(학습하기/문제풀기)·오답노트·이력서(텍스트/PDF)·모의면접(SSE)·OAuth 4종·로컬→DB 이전. URL 경로와 비회원 저장 형식(localStorage `{ version: 1, items }`)은 Flutter와 동일
- 웹 전용 레이아웃(넓은 화면 좌측 내비 + 본문 폭 제한)은 이 마일스톤에 포함 (기존 M6의 항목을 흡수)
- 면접은 브라우저가 `interview-chat`을 직접 호출(Next 서버 경유 금지), PDF 추출은 `webapp/app/api/parse-pdf` Route Handler
- Vercel: 기존 루트 프로젝트의 Root Directory를 `webapp/`으로 변경(새 프로젝트 없음). 변경 후 develop Preview는 Next만 빌드, **컷오버(develop → main 릴리즈 push) 전에는 `main`에 push하지 않는다**
- 완료 기준: Chrome · macOS Safari · iOS Safari · Android Chrome에서 Flutter 웹과 동등 기능 확인(면접 스트리밍이 점진 표시됨), 로그인 4종 성공, 컷오버 전후로 모바일 PDF 업로드가 끊기지 않음, CI(`test`/`admin`/`webapp`) 통과
- 컷오버 후 별도 정리: Flutter 웹 빌드 경로(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, Flutter `web/`)

## M6 이후: iOS 앱스토어 출시 + 웹 컷오버
- 범위: iOS 출시 + 웹 컷오버. Android 스토어 출시는 이후 (ADR-025). 계획: `docs/plans/ios-release-cutover.md`
- 방침·약관(`/privacy`·`/terms`) + 면접 첫 사용 OpenAI 전송 동의 (ADR-027)
- 계정 삭제(`delete-account`, Apple 토큰 철회 포함) (ADR-026)
- Apple 로그인 재도입(iOS 앱 전용), 구글 로그인은 첫 출시에서 숨겼다가 앱·웹 모두 복원 (ADR-025 정정)
- iOS 출시 자산: 앱 아이콘·스플래시·Privacy Manifest·암호화 신고 키
- 웹 컷오버: 브라우저별 실측 후 develop → main 릴리즈 push 1회, Supabase Site URL을 운영 도메인으로
- App Store Connect 등록 → TestFlight → 심사 제출
- 완료 기준: 운영 도메인에서 방침·약관·PDF·로그인·계정 삭제 동작, TestFlight 실기기 전체 여정 통과, 심사 제출

## M7. 폴리시/QA
- 로딩·에러·빈 상태 정리, 오프라인 처리, 접근성 (Flutter, Next 웹 모두)
- (기존 M6의 "웹 전용 레이아웃" 항목은 새 M6 Next.js 웹 전환으로 흡수됨)
- Android/iOS/Web 전체 여정 점검 (`CLAUDE.md` Definition of Done)
- 발견한 플랫폼별 특이사항을 `CLAUDE.md` Non-Obvious Rules에 기록
- 릴리즈 시 `main`에 push → Production 배포
