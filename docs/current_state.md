# 현재 상태

마지막 갱신: 2026-09-18

## 완료
- Flutter 프로젝트, GitHub 레포(`doxmt/my_app`), Claude Code 하네스, Vercel 웹 배포 + GitHub Actions CI
- M0. 설계 문서화, 데스크톱 플랫폼 폴더 삭제
- M1. Supabase 세팅 + 기기 ID + 내비게이션 뼈대 (PR #2)
- M2. 카테고리/문제풀이 + 로컬 오답노트 (PR #7, 머지 완료)
- M3. 이력서 입력 + 모의면접 (비회원) — 구현 완료, PR #9(`Closes #8`) 생성됨, 아직 머지 전
  - PDF 파싱 Vercel 함수(`api/parse-pdf.ts`, unpdf), `increment_guest_usage` RPC + `rate_limit_config`(임시값 device 10 / ip 40), `interview-chat` Edge Function(Anthropic/OpenAI 어댑터, SSE), 이력서·모의면접 Flutter UI
  - `flutter analyze`/`flutter test`(35개)/Deno 테스트(9개) 전부 통과, 배포된 엔드포인트는 curl로 실동작 검증
  - 계획: `docs/plans/m3-resume-interview.md`, 결정: `docs/adr.md` ADR-013

## 예정
- **PR #9 머지 전 필수**: iOS 시뮬레이터에서 이력서 입력 → PDF → 분야/직무 선택 → 메시지 전송 → 429/에러 상태 → 재시작 후 유지, 이 실제 화면 흐름을 직접 탭해서 확인 (이번 세션엔 GUI 자동화 권한 문제로 못 함)
- PR #9 CI 확인 → 머지 → `git pull origin develop`
- 사용자 피드백: 홈 분야 목록을 카드형 UI(아이콘/이미지)로 바꾸고 싶어함 — 처리 시점(M2 후속 vs M6) 미정
- iOS 시뮬레이터로 M2 드릴다운 화면(문제풀이 → 오답노트) 전체 여정 재확인 필요 (M2 세션엔 홈 화면만 확인함)
- Android는 이 Mac에 AVD가 없어 여전히 미확인 (M2, M3 공통)
- M3 실호출 검증 후속 작업: LLM API 키 확보 후 Anthropic/OpenAI 실제 호출 + iOS 종단 스트리밍 검증 (`docs/plans/open-questions.md` M3 섹션 참고)
- M4. OAuth 회원가입 — `docs/roadmap.md` 참고, 시작 전 `/plan` 필요

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0, Vercel CLI 59.20.0, iOS 배포 타깃 15.0
- Supabase: ref `bmewpbkllmlikzqkxalw` (Tokyo). 새 테이블 자동 노출 끔 + 자동 RLS → 마이그레이션마다 GRANT·정책 필수 (M3에서 service_role GRANT 누락도 겪음, 새 함수/테이블마다 확인)
- **postgrest Dart 클라이언트의 `.order()`는 `ascending` 기본값이 `false`**(SQL/REST 기본과 반대) — 정렬이 필요한 모든 쿼리에 `ascending: true`를 명시해야 함 (M2에서 발견)
- **Vercel `buildCommand`는 256자 제한** — 길어지면 `scripts/`에 빌드 스크립트로 분리하고 `buildCommand`는 그걸 실행하는 한 줄로 축약 (M3에서 발견)
- **`.vercelignore` 없으면 `build/`, `.dart_tool/`, `node_modules/` 같은 큰 디렉토리까지 업로드 시도됨** — Vercel 프로젝트에 Node 함수를 추가할 때 반드시 같이 챙길 것 (M3에서 발견)
- **`file_picker` 13.1.0은 `FilePicker.platform.pickFiles(withData: true)`가 아니라 `FilePicker.pickFiles()`(정적 메서드) + `PlatformFile.readAsBytes()`** — 계획 단계에서 조사한 API와 실제 배포 버전이 다를 수 있으니 구현 직전에 재확인 권장 (M3에서 발견)
- `functions.invoke`는 스트리밍 응답을 지원하지 않음 → Edge Function을 스트리밍으로 쓰려면 `package:http`로 Function URL 직접 호출 (ADR-013)
- 로컬 실행: `flutter run --dart-define-from-file=env/dev.json`
- GitHub 기본 브랜치는 `develop` (Vercel Production 브랜치는 `main`)
- `profiles` 자동 생성 트리거는 미정 (M4 전 결정, open-questions 참고)
- 구조 스케치: https://claude.ai/artifact/MgDZ3r2UzX3iky8AxuZh5E
