---
description: 다음 작업의 세부 계획 수립 (planner 초안 → planner 최종)
argument-hint: ""
allowed-tools: Read, Agent
---

다음 파일들을 읽어 command 실행 컨텍스트를 파악하라 (없으면 건너뜀):

- `docs/roadmap.md` — 전체 구현 순서
- `docs/current_state.md` — 현재 작업 상태

그 다음 planner 에이전트를 호출하여 인터뷰와 1차 계획 초안을 생성하게 하라.
첫 번째 planner 호출 시 다음 실행 맥락을 명시하라:

- 현재 planner는 subagent로 실행 중이므로 다른 Agent를 호출하지 않는다.
- planner가 담당하는 시작 문서(`docs/prd.md`, `docs/adr.md`, `docs/architecture.md`)는 planner가 직접 읽는다.
- 사용자와 인터뷰를 진행한다.
- 사용자가 명시적으로 계획 생성을 요청하면 `docs/plans/{task}.md`에 아직 저장하지 말고 1차 계획 초안을 출력한다.
- 1차 계획 초안에는 컨텍스트, 작업 목표, 가드레일, 작업 흐름, 인수 기준, Open Questions를 포함한다.
- 코드베이스 사실, 외부 문서, 문서 업데이트가 필요하면 직접 Agent를 호출하지 말고 초안의 `Main Command Requests` 섹션에 필요한 호출 대상을 명확히 적는다.
- 구현은 시작하지 않는다.

planner 초안의 `Main Command Requests`에서 코드베이스 사실 확인을 요청하면 explore 에이전트를 호출하라.
코드베이스 사실을 사용자에게 묻지 말고 explore 결과로 확인하라.

planner 초안의 `Main Command Requests`에서 외부 공식 문서, API/프레임워크 참조, 패키지 버전 호환성 확인을 요청하면 document-specialist 에이전트를 호출하라.

planner 초안의 `Main Command Requests`에서 `docs/overview.md`, `docs/adr.md`, `docs/architecture.md`, `docs/prd.md`, `docs/roadmap.md` 업데이트가 필요하다고 요청하면 writer 에이전트를 호출하라.
단, 계획 파일 자체는 planner가 작성하게 하라.

마지막으로 planner 에이전트를 다시 호출하여 계획 파일을 생성하게 하라.
planner에게는 사용자 인터뷰 결과, 1차 계획 초안, 호출했다면 explore/document-specialist/writer 결과를 함께 전달하라.

- 현재 planner는 subagent로 실행 중이므로 다른 Agent를 호출하지 않는다.
- explore/document-specialist/writer 조사는 이 command가 이미 수행했거나 필요한 범위에서 생략했다고 간주한다.
- 전달받은 1차 계획 초안과 explore/document-specialist/writer 결과를 반영한다.
- `docs/plans/{task}.md`를 생성한다.
- 1차 계획 초안에 `### Open Questions` 섹션이 있으면 필요한 항목을 `docs/plans/open-questions.md`에 반영한다.
- 구현은 시작하지 않는다.
