# 현재 상태

마지막 갱신: 2026-09-28

## 완료
- Flutter 프로젝트, GitHub 레포(`doxmt/my_app`), Claude Code 하네스, Vercel 웹 배포 + GitHub Actions CI
- M0~M5-a: 설계 문서화, Supabase 세팅, 카테고리/문제풀이, 이력서+모의면접(비회원), OAuth 회원가입(Google+GitHub), 어드민 웹앱 — 전부 `develop`에 머지 완료
- **이번 세션(이슈 #21, 브랜치 `feat/21-apple-kakao-login-home-ui`)**: 계획 파일 `docs/plans/oauth-apple-kakao-home-ui-llm.md` 기준 진행
  - 번들 ID `com.doxmt.devinterview` / 앱 표시명 `DevInterview`로 교체, 딥링크 스킴 등록
  - Apple 로그인(네이티브 `sign_in_with_apple`) + Kakao 로그인(`signInWithOAuth`, 이메일 미필수) 구현
  - 로그인 버튼 4종(Google/Apple/Kakao/GitHub)을 각 사 공식 브랜드 가이드 기준으로 재구현, 공식 에셋은 `assets/login/`에 출처와 함께 정리(README)
  - 홈 분야 카드 UI + 학습하기/문제풀기 선택 화면·주제 목록 화면 카드화(`category_icons.dart`로 `slug→IconData` 매핑, DB 변경 없음)
  - 문제풀기: 주제 선택 시 목록 없이 랜덤 문제로 바로 진입 + 분야 전체 랜덤 카드 추가
  - 콘텐츠 대량 확충: 모바일·인프라/DevOps 신규 분야(14주제 140문제), 프론트엔드 7주제(70문제), AI 3주제(30문제) — 서브에이전트 조사 작성 → 독립 2차 검증 → 중복 확인 후 게시. 전체 게시 문제 24개 → **264개**
  - LLM 키 연결: OpenAI 발급·`supabase secrets set`로 등록(`LLM_PROVIDER=openai`), `interview-chat`의 빈 `catch{}` 4곳에 에러 로깅 추가·재배포. OpenAI 크레딧 충전 후 curl로 실제 SSE 스트리밍 성공 확인(비회원 경로만, `deviceRemaining`/`ipRemaining` 정상 반영)
  - `rate_limit_config` 현재값 확인: `guest_device` 3회/일, `guest_ip` 40회/일, `free`(회원) 12회/일. `paid` 등급은 아직 미등록

## 예정
- 이번 세션 마지막 변경(`interview-chat` 에러 로깅) 커밋 → push → PR 생성 → CI 확인 (wrap 다음 단계로 진행 중)
- **웹(Chrome) 모의면접 종단 검증 미완료**: curl 스모크만 확인했고, 실제 Flutter 웹 빌드에서 `package:http` 스트리밍이 청크 단위로 끊기지 않고 받아지는지 확인 안 됨(ADR-013이 미뤘던 항목)
- **회원(로그인) 경로 LLM 실호출 미검증**: 비회원 경로만 확인함
- **앱 아이콘 미적용**: 시안(말풍선+`</>`)만 만들어 둠, 승인 시 `flutter_launcher_icons`로 적용 필요
- **외부 콘솔 설정(사용자 몫, M-2~M-7)**: Apple Developer Services ID·.p8 키, Apple App ID Sign in with Apple 활성화, Kakao Developers 콘솔(Redirect URI·Client Secret·동의항목), Supabase Apple/Kakao provider 설정 및 "Allow users without an email", 기존 Google iOS OAuth 클라이언트를 새 번들 ID(`com.doxmt.devinterview`)로 재등록
- iOS 시뮬레이터·Android에서 Apple/Kakao 로그인 실제 동작(콘솔 설정 완료 후) 및 GitHub 로그인 브라우저→앱 복귀 확인 안 됨
- M5-a 수동 작업 잔여(이전 세션분): 어드민 콘텐츠 생성 → 앱 노출 E2E, PR #12(M4 OAuth) 관련 Google/GitHub 콘솔 등록·실제 로그인 검증도 여전히 미완
- M5-b(`content-pipeline`, 임베딩) — 이번 세션에서 착수 안 함(임베딩 키 별도 필요)
- `interview-chat` 회원 세션이 completed로 전환되지 않는 기존 이슈는 이번 세션에서 다루지 않음

## 참고사항
- 환경: Flutter 3.47.4 / Dart 3.13.3, Supabase CLI 2.104.0(2.118.0으로 업그레이드 권장), Node 22(admin CI)
- Supabase: ref `bmewpbkllmlikzqkxalw` (Tokyo/Seoul 리전 혼재 로그 확인됨). `interview-chat` v7~8, OpenAI 프로바이더로 전환됨(secrets: `LLM_PROVIDER=openai`, `OPENAI_API_KEY`)
- **Edge Function 에러는 반드시 `console.error`로 남겨야 원격 디버깅이 가능하다** — 빈 `catch {}`로 스웰로우하면 Supabase 로그에 아무것도 안 남아 원인 파악이 불가능했음(OpenAI `insufficient_quota` 진단 때 확인)
- **위젯의 기반 타입을 바꾸면(`ConsumerWidget` → `ConsumerStatefulWidget` 등) 핫 리로드가 아니라 핫 리스타트가 필요하다** — `TopicListPage` 변경 때 `type 'X' is not a subtype of ConsumerWidget?` 오류로 확인
- 콘텐츠 문제는 반드시 서브에이전트가 웹 검색으로 공식 문서를 대조하며 작성하게 하고, 별도 독립 에이전트로 2차 검증을 거친 뒤에만 게시한다(1차 작성만으로는 일반 지식 기반 오류가 다수 나왔음)
- 번들 ID `com.doxmt.devinterview`, 딥링크 스킴 `com.doxmt.devinterview://login-callback`, 앱 표시명 `DevInterview`로 확정(ADR-018)
- Kakao 심볼 등 공식 로고 에셋은 벤더의 원본 다운로드 리소스(PSD 등)에서 직접 추출해야 안전 — 서드파티 아이콘으로 대체하면 브랜드 가이드 위반
- 로컬 실행: `flutter run --dart-define-from-file=env/dev.json`
- GitHub 기본 브랜치는 `develop` (Vercel Production 브랜치는 `main`)
