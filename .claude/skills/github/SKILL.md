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

라벨과 GitHub 네이티브 Issue Type을 함께 지정한다 (`--label`로 라벨, `--type`은 gh CLI가 아직 지원하지 않아 라벨만 붙이고 Issue Type은 웹 UI에서 수동으로 맞춘다):

```bash
gh issue create \
  --title "feat: 기능명" \
  --body "..." \
  --label feat
```

제목 형식과 라벨/Issue Type 매핑:

| 제목 접두사 | 라벨 | Issue Type |
|---|---|---|
| `feat:` 기능 추가 | `feat` | Feature |
| `fix:` 버그 수정 | `fix` | Bug |
| `style:` 스타일 | (해당 라벨 없음, 필요 시 `refactor`) | Task |
| `refactor:` 리팩토링 | `refactor` | Task |
| `chore:` 기타 | `chore` | Task |
| `docs:` 문서 작업 | `docs` | Task |
| `test:` 테스트 추가/수정 | `test` | Task |
| `config:` 환경설정 변경 | `config` | Task |
| `deploy:` 배포 관련 | `deploy` | Task |
| `design:` 디자인/UI | `design` | Task |

라벨은 레포에 만들어져 있다(`gh label list`로 확인). PR에도 같은 라벨을 단다.

## 브랜치 생성

이슈 번호를 브랜치명에 포함. **브랜치명은 영문(로마자)으로 쓴다** — 한글 등 비ASCII 문자는 GitHub이 hidden character 경고를 띄운다:

```bash
git checkout -b feat/{이슈번호}-{기능명-영문}
# 예: feat/1-home-screen
# 예: fix/2-login-error
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
  --base develop \
  --label feat
```

본문에 `Closes #{이슈번호}` 필수 — PR 머지 시 이슈 자동 닫힘 (레포 기본 브랜치가 `develop`이라 develop 머지에서도 동작)

## 머지

- Squash merge 사용
- 머지 후 브랜치 삭제
- 머지 후 `git pull origin develop` — 최신화
