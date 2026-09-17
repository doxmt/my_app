---
description: 다음 작업 이슈/브랜치 생성 후 구현 시작 (explore/architect → executor)
argument-hint: ""
allowed-tools: Read, Agent, Bash(git:*), Bash(gh:*)
---

1. `docs/current_state.md` 읽기 — 예정 목록에서 다음 작업을 확인하고 사용자에게 보여준 뒤, 이 작업을 시작할지 확인하라.

사용자가 확인하면:

2. `docs/plans/`에서 이번 태스크와 관련된 plan 파일을 찾아라. plan 파일이 없으면 사용자에게 `/plan`을 먼저 실행하여 계획을 수립하도록 안내하고 중단하라. (이슈/브랜치를 만들기 전에 확인해야 고아 이슈가 생기지 않는다.)
3. `git checkout develop && git pull origin develop` 으로 develop으로 이동 후 최신화하라
4. 작업 타입에 맞는 `.claude/skills/github/templates/` 템플릿을 참조해 이슈를 생성하라 (`.claude/skills/github/SKILL.md` 규칙 따름)
5. 생성된 이슈 번호로 브랜치를 만들고 이동하라
6. 구현 전에 코드베이스에서 직접 확인해야 하는 사실이 있으면 explore 에이전트를 호출하라.
   - 특히 3개 이상의 영역을 동시에 조사해야 하면 필요한 범위별로 explore를 호출하라.
7. 아키텍처 경계, 설계 위험, 변경 방향의 교차 확인이 필요하면 architect 에이전트를 호출하라.
8. executor 에이전트를 호출하여 plan 파일에 따라 구현하게 하라. 태스크명, plan 파일 경로, 호출했다면 explore/architect 결과를 함께 전달하라. 커밋은 하지 않는다.
   - 현재 executor는 subagent로 실행 중이므로 다른 Agent를 호출하지 않게 하라.
   - explore/architect 조사는 이 command가 이미 수행했거나 필요한 범위에서 생략했다고 간주하게 하라.
   - 전달받은 사전 분석을 반영하되, 모든 코드 변경은 executor가 직접 수행하게 하라.

사용자가 수정하면:
수정된 내용으로 위 과정을 진행하라.
