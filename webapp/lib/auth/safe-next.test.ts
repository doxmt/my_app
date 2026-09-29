import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath (open redirect 방지)", () => {
  it("/로 시작하는 내부 경로만 허용한다", () => {
    expect(safeNextPath("/me/wrong-notes")).toBe("/me/wrong-notes");
    expect(safeNextPath("/categories/cs?x=1")).toBe("/categories/cs?x=1");
  });

  it("외부 URL·프로토콜 상대 URL·백슬래시·빈 값은 기본값으로", () => {
    expect(safeNextPath("https://evil.example")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
    expect(safeNextPath("/\\evil.example")).toBe("/");
    expect(safeNextPath("evil")).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });

  it("기본값을 지정할 수 있다", () => {
    expect(safeNextPath(null, "/me")).toBe("/me");
  });
});
