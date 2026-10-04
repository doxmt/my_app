import { describe, expect, it } from "vitest";
import { summarizeFieldStats } from "./supabase-data";

describe("summarizeFieldStats", () => {
  it("주제 행을 분야별 주제 수와 문제 수로 묶는다", () => {
    const stats = summarizeFieldStats([
      { parent_id: "f1", questions: [{ count: 3 }] },
      { parent_id: "f1", questions: [{ count: 5 }] },
      { parent_id: "f2", questions: [{ count: 0 }] },
    ]);

    expect(stats).toEqual({ f1: { topics: 2, questions: 8 }, f2: { topics: 1, questions: 0 } });
  });

  it("문제 수가 없거나 분야가 없는 행도 오류 없이 처리한다", () => {
    const stats = summarizeFieldStats([
      { parent_id: "f1", questions: [] },
      { parent_id: "f1", questions: null },
      { parent_id: null, questions: [{ count: 9 }] },
    ]);

    expect(stats).toEqual({ f1: { topics: 2, questions: 0 } });
  });
});
