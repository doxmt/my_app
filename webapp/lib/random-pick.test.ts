import { describe, expect, it } from "vitest";
import type { Question } from "./models";
import { parseRandomScope, pickRandomEntry, randomEntriesOfTopic } from "./random-pick";

function question(id: string): Question {
  return { id, categoryId: "t1", type: "essay", prompt: id, modelAnswer: null, difficulty: null, tags: [] };
}

/** 항상 같은 값을 돌려주는 결정적 난수. */
const fixed = (value: number) => () => value;

const pool = [
  { topicSlug: "a", questionId: "q1" },
  { topicSlug: "a", questionId: "q2" },
  { topicSlug: "b", questionId: "q3" },
];

describe("randomEntriesOfTopic", () => {
  it("문제마다 주제 슬러그를 붙인 항목을 만든다", () => {
    expect(randomEntriesOfTopic("a", [question("q1"), question("q2")])).toEqual([
      { topicSlug: "a", questionId: "q1" },
      { topicSlug: "a", questionId: "q2" },
    ]);
  });
});

describe("pickRandomEntry", () => {
  it("난수가 가리키는 항목을 고른다", () => {
    expect(pickRandomEntry(pool, fixed(0.99))?.questionId).toBe("q3");
    expect(pickRandomEntry(pool, fixed(0))?.questionId).toBe("q1");
  });

  it("현재 문제는 후보에서 제외한다", () => {
    for (const value of [0, 0.4, 0.7, 0.99]) {
      expect(pickRandomEntry(pool, fixed(value), "q2")?.questionId).not.toBe("q2");
    }
    expect(pickRandomEntry(pool, fixed(0.99), "q3")?.questionId).toBe("q2");
  });

  it("풀이 비어 있으면 null이다", () => {
    expect(pickRandomEntry([], fixed(0))).toBeNull();
  });

  it("풀에 현재 문제 하나뿐이면 null이다", () => {
    expect(pickRandomEntry([pool[0]], fixed(0), "q1")).toBeNull();
  });

  it("제외하지 않으면 문제 하나뿐인 풀에서도 그 문제를 고른다", () => {
    expect(pickRandomEntry([pool[0]], fixed(0))?.questionId).toBe("q1");
  });
});

describe("parseRandomScope", () => {
  it("field/topic만 해석하고 나머지는 null이다", () => {
    expect(parseRandomScope("field")).toBe("field");
    expect(parseRandomScope("topic")).toBe("topic");
    expect(parseRandomScope("x")).toBeNull();
    expect(parseRandomScope(undefined)).toBeNull();
    expect(parseRandomScope(["field"])).toBeNull();
  });
});
