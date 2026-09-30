import { describe, expect, it } from "vitest";
import { joinDictation, speechErrorMessage } from "./speech";

describe("joinDictation", () => {
  it("입력창이 비어 있으면 인식된 글만 쓴다", () => {
    expect(joinDictation("", "  안녕하세요 ")).toBe("안녕하세요");
  });

  it("기존 글 뒤에 공백 하나로 이어 붙인다", () => {
    expect(joinDictation("프로세스는", "실행 중인 프로그램입니다")).toBe("프로세스는 실행 중인 프로그램입니다");
  });

  it("기존 글이 공백·줄바꿈으로 끝나면 공백을 더하지 않는다", () => {
    expect(joinDictation("첫 문장.\n", "둘째 문장")).toBe("첫 문장.\n둘째 문장");
  });

  it("인식된 글이 없으면 기존 글을 그대로 둔다", () => {
    expect(joinDictation("기존", "   ")).toBe("기존");
  });
});

describe("speechErrorMessage", () => {
  it("권한 오류는 마이크 허용 안내를 준다", () => {
    expect(speechErrorMessage("not-allowed")).toContain("마이크 권한");
  });

  it("사용자가 직접 멈춘 경우(aborted)는 안내하지 않는다", () => {
    expect(speechErrorMessage("aborted")).toBeNull();
  });

  it("알 수 없는 오류도 일반 안내를 준다", () => {
    expect(speechErrorMessage("something-else")).toContain("오류");
  });
});
