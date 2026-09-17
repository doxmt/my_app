---
description: 이번 작업 세션을 마무리하고 문서를 업데이트하라.
argument-hint: ""
allowed-tools: Read, Edit, Bash(cat:*), Bash(git rev-parse:*)
---

이번 세션을 마무리합니다. 아래 순서대로 진행하세요.

**중요: 세션에서 한 작업은 대화 내용에서 바로 파악하세요. 작업 내용 파악을 위해 파일을 읽지 마세요.** (3·5단계에서 기존 문서를 수정할 때만 해당 파일을 읽습니다.)

## 1. work_log.md에 이번 세션 append

Bash heredoc으로 바로 추가 (읽기 없이):

```bash
cat >> "$(git rev-parse --show-toplevel)/docs/work_log.md" << 'EOF'

## YYYY-MM-DD
- (완료한 작업 한 줄씩)

### 주요 변경 파일
- (파일 경로)
EOF
```

## 2. current_state.md 덮어쓰기

Bash heredoc으로 바로 덮어쓰기 (읽기 없이):

```bash
cat > "$(git rev-parse --show-toplevel)/docs/current_state.md" << 'EOF'
# 현재 상태

마지막 갱신: YYYY-MM-DD

## 완료
- (완료된 작업 간단 요약)

## 예정
- (다음에 이어서 할 작업)

## 참고사항
- (다음 세션에서 알아야 할 것. 없으면 생략)
EOF
```

## 3. architecture.md 갱신 (아키텍처 변경이 있었던 경우에만)

이번 세션에서 기술 스택, 디렉토리 구조, 패턴, 데이터 흐름 등 아키텍처 관련 변경이 있었다면:

1. `docs/architecture.md`를 Read로 읽는다 — 통째로 덮어쓰면 변경 없는 섹션이 유실되므로 반드시 먼저 읽는다.
2. 변경된 섹션만 Edit으로 수정한다.

변경이 없었다면 이 단계는 건너뜁니다.

## 4. adr.md에 새 결정 append (기술 결정이 있었던 경우에만)

이번 세션에서 새로운 기술 결정(라이브러리 선택, 패턴 채택, 구조 변경 등)이 있었다면 추가:

```bash
cat >> "$(git rev-parse --show-toplevel)/docs/adr.md" << 'EOF'

---

## ADR-00N: {제목}

**날짜:** YYYY-MM-DD
결정: (무엇을 결정했는가)
이유: (왜 이 결정을 했는가)
대안: (검토한 대안)
트레이드오프: (장단점)
EOF
```

변경이 없었다면 이 단계는 건너뜁니다.

## 5. prd.md 갱신 (제품 범위/목표 변경이 있었던 경우에만)

이번 세션에서 기능 추가/제거, 성공 기준 변경, MVP 범위 조정 등이 있었다면 `docs/prd.md`를 Read로 읽고 해당 섹션만 Edit으로 수정합니다.
변경이 없었다면 이 단계는 건너뜁니다.

완료되면 "wrap 완료 ✓" 라고 출력하세요.
