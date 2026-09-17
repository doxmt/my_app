---
description: 변경사항을 커밋하고 원격에 푸시한 뒤 PR을 생성한다.
argument-hint: ""
allowed-tools: Bash(git:*), Bash(gh:*)
---

현재 브랜치의 커밋되지 않은 변경사항을 확인하라.

미커밋 파일이 있으면 사용자에게 알리고 커밋 여부를 확인한 뒤 진행하라.

1. 현재 브랜치를 원격으로 푸쉬하라
2. .claude/skills/github/templates/pr.md 를 참조해 PR을 생성하라 (.claude/skills/github/SKILL.md 규칙 따름)
   - base 브랜치는 develop
   - 본문에 Closes #{이슈번호} 포함
