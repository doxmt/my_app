import { describe, expect, it } from "vitest";
import { parseThemePreference, resolveTheme } from "./theme";

describe("parseThemePreference", () => {
  it("light/dark만 인정하고 나머지는 저장값 없음(null)으로 본다", () => {
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBeNull();
    expect(parseThemePreference("")).toBeNull();
    expect(parseThemePreference(null)).toBeNull();
  });
});

describe("resolveTheme", () => {
  it("저장값이 없으면 라이트가 기본이다", () => {
    expect(resolveTheme(null)).toBe("light");
  });

  it("저장값이 있으면 그 값을 쓴다", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
});
