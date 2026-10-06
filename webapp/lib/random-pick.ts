import type { Question } from "@/lib/models";

/** 랜덤으로 고를 수 있는 문제 하나. 상세 경로를 만들 때 주제 슬러그가 필요해 함께 든다. */
export type RandomEntry = { topicSlug: string; questionId: string };

/** 학습하기 상세 "다음 랜덤 문제"의 범위. URL 쿼리 `?random=field|topic`로 전달한다(Flutter 앱과 동일). */
export type RandomScope = "field" | "topic";

export function parseRandomScope(value: string | string[] | undefined): RandomScope | null {
  return value === "field" || value === "topic" ? value : null;
}

/** 주제 하나의 문제들을 랜덤 풀 항목으로 바꾼다. */
export function randomEntriesOfTopic(topicSlug: string, questions: Question[]): RandomEntry[] {
  return questions.map((question) => ({ topicSlug, questionId: question.id }));
}

/** 풀에서 무작위로 하나를 고른다. `excludeQuestionId`는 후보에서 뺀다. 고를 문제가 없으면 null. */
export function pickRandomEntry(
  pool: RandomEntry[],
  random: () => number = Math.random,
  excludeQuestionId?: string,
): RandomEntry | null {
  const candidates = excludeQuestionId ? pool.filter((entry) => entry.questionId !== excludeQuestionId) : pool;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(random() * candidates.length)];
}
