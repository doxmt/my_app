---
name: github
description: GitHub workflow rules - 이슈/PR 생성, 브랜치 네이밍, 커밋 컨벤션
disable-model-invocation: true
---

# GitHub 워크플로우

## 작업 흐름

1. `git checkout develop && git pull origin develop` — develop으로 이동 후 최신화
2. 이슈 생성 → 번호 확인
3. 이슈 번호로 브랜치 생성 (`develop` 기점)
4. 작업 & 커밋
5. PR 생성 (`develop` 기준)
6. (선택) `/pr-review` 실행 → `docs/pr-review.md` 리뷰 결과 확인, 수정사항 있으면 커밋 & 푸시 — 사용자가 원하면 건너뛴다
7. Squash merge → 브랜치 삭제 → `git pull origin develop`

## 이슈 생성

작업 시작 전 이슈를 생성한다. 본문은 `.claude/skills/github/templates/`의 템플릿을 참조:

- 기능 추가 → `feature.md`
- 버그 수정 → `bug.md`
- 테스트 추가 → `test.md`

```bash
gh issue create \
  --title "feat: 기능명" \
  --body "..."
```

제목 형식:
- 기능 추가: `feat: 기능명`
- 버그 수정: `fix: 버그명`
- 스타일: `style: 내용`
- 리팩토링: `refactor: 내용`

## 브랜치 생성

이슈 번호를 브랜치명에 포함:

```bash
git checkout -b feat/{이슈번호}-{기능명}
# 예: feat/1-홈화면
# 예: fix/2-로그인오류
```

## 커밋 메시지

```
feat: 기능 추가
fix: 버그 수정
style: 스타일 변경
refactor: 리팩토링
chore: 기타
```

## PR 생성

작업 완료 후 PR 생성, 반드시 `develop` 브랜치로. 본문은 `.claude/skills/github/templates/pr.md` 참조:

```bash
gh pr create \
  --title "feat: 기능명" \
  --body "..." \
  --base develop
```

본문에 `Closes #{이슈번호}` 필수 — PR 머지 시 이슈 자동 닫힘

## 머지

- Squash merge 사용
- 머지 후 브랜치 삭제
- 머지 후 `git pull origin develop` — 최신화
