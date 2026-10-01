import { describe, expect, it } from "vitest";
import { extractSelfIntroduction, MAX_SELF_INTRODUCTION_CHARS } from "./self-intro";

// 앱 테스트(test/features/resume/domain/self_intro_extractor_test.dart)와 같은 케이스를 유지한다.
describe("extractSelfIntroduction", () => {
  const body = "저는 3년차 백엔드 개발자입니다.\n문제 해결을 좋아합니다.";

  it.each([
    "자기소개",
    "자기소개서",
    "소개",
    "## 자기소개",
    "■ 자기소개",
    "[자기소개]",
    "【자기소개】",
    "(자기소개)",
    "- 자기소개:",
    "  자기소개 ：  ",
    "Self Introduction",
    "ABOUT ME",
    "Summary",
    "profile",
  ])("제목 줄 '%s' 다음 본문을 가져온다", (title) => {
    expect(extractSelfIntroduction(`홍길동\n\n${title}\n${body}`)).toBe(body);
  });

  it("제목이 없으면 빈 문자열", () => {
    expect(extractSelfIntroduction("홍길동\n경력\n회사 A 3년")).toBe("");
  });

  it("본문 뒤 다음 섹션 제목 직전까지만 가져온다", () => {
    const text = `자기소개\n${body}\n\n경력\n회사 A 3년\n`;
    expect(extractSelfIntroduction(text)).toBe(body);
  });

  it("장식이 붙은 영문 다음 섹션도 경계로 본다", () => {
    expect(extractSelfIntroduction(`About me\n${body}\n## Experience\nCompany A`)).toBe(body);
  });

  it("다음 섹션이 없으면 끝까지 가져오고 앞뒤 공백·빈 줄을 정리한다", () => {
    expect(extractSelfIntroduction(`자기소개\n\n   \n${body}\n\n\n`)).toBe(body);
  });

  it("본문이 비어 있으면 빈 문자열", () => {
    expect(extractSelfIntroduction("자기소개\n\n경력\n회사 A")).toBe("");
  });

  it("1500자를 넘으면 자른다", () => {
    const long = "가".repeat(MAX_SELF_INTRODUCTION_CHARS + 200);
    expect(extractSelfIntroduction(`자기소개\n${long}`)).toBe("가".repeat(MAX_SELF_INTRODUCTION_CHARS));
  });

  it("문장 중에 자기소개 단어가 들어간 줄은 제목이 아니므로 무시한다", () => {
    expect(extractSelfIntroduction("저는 자기소개를 잘합니다\n다음 줄")).toBe("");
  });

  it("제목이 맨 끝 줄이면 빈 문자열", () => {
    expect(extractSelfIntroduction("홍길동\n경력\n회사 A\n자기소개")).toBe("");
  });

  it("제목이 여러 번 나오면 첫 번째를 쓴다", () => {
    expect(extractSelfIntroduction("자기소개\n첫째\n경력\nX\n자기소개\n둘째")).toBe("첫째");
  });

  it("CRLF 줄바꿈도 처리한다", () => {
    expect(extractSelfIntroduction("자기소개\r\n첫째 줄\r\n경력\r\nX")).toBe("첫째 줄");
  });
});
