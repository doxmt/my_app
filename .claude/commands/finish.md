---
description: 현재 브랜치의 PR을 squash merge하고 정리하라.
argument-hint: ""
allowed-tools: Bash(git:*), Bash(gh:*)
---

현재 브랜치의 PR을 squash merge하고 정리하라.

1. 현재 브랜치와 열린 PR 확인:

```bash
git branch --show-current
gh pr view --json number,title,state
```

PR이 없거나 merged/closed 상태면 중단하고 사용자에게 알려라.

2. Squash merge:

```bash
gh pr merge --squash --delete-branch
```

3. develop으로 이동 후 최신화:

```bash
git checkout develop
git pull origin develop
```
