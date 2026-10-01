import { describe, expect, it } from "vitest";
import { resumeReturnPath } from "./return-path";

describe("resumeReturnPath", () => {
  it("next가 안전한 내부 경로면 그 경로를 돌려준다", () => {
    expect(resumeReturnPath("?next=/interview")).toBe("/interview");
  });

  it("next가 없으면 null이다", () => {
    expect(resumeReturnPath("")).toBeNull();
    expect(resumeReturnPath("?foo=bar")).toBeNull();
  });

  it("외부 주소나 프로토콜 상대 주소는 거부한다", () => {
    expect(resumeReturnPath("?next=https://evil.example")).toBeNull();
    expect(resumeReturnPath("?next=//evil.example")).toBeNull();
    expect(resumeReturnPath("?next=%5Cevil")).toBeNull();
  });
});
