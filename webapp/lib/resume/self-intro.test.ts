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

describe("경력 영역 경계", () => {
  const body = "저는 3년차 백엔드 개발자입니다.\n문제 해결을 좋아합니다.";

  it("'업무 경험' 제목과 그 아래 날짜·회사 줄은 자기소개에 넣지 않는다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n\n업무 경험\n2026.06\n- 2026.08\n회사 A\n(인턴)`)).toBe(body);
  });

  it.each(["업무경험", "경력 사항", "학력 및 교육", "Work  Experience", "기술 스택", "수상 경력"])(
    "띄어쓰기가 달라도 '%s'를 다음 섹션으로 본다",
    (heading) => {
      expect(extractSelfIntroduction(`자기소개\n${body}\n${heading}\n내용`)).toBe(body);
    },
  );

  it("다음 섹션 제목을 못 알아봐도 날짜만 있는 줄에서 끊는다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n2026.06\n- 2026.08\n회사 A`)).toBe(body);
  });

  it("기간이 한 줄에 있어도 날짜 줄로 보고 끊는다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n2026.06 - 2026.08\n회사 A`)).toBe(body);
    expect(extractSelfIntroduction(`자기소개\n${body}\n2025.01 - 현재\n회사 B`)).toBe(body);
  });

  it("문장 안의 날짜는 경계가 아니다", () => {
    expect(extractSelfIntroduction("자기소개\n2026.06에 입사해 일했습니다.\n문제 해결을 좋아합니다.")).toBe(
      "2026.06에 입사해 일했습니다.\n문제 해결을 좋아합니다.",
    );
  });
});

describe("자기소개 안에 섹션명과 같은 말이 있을 때", () => {
  const body = "저는 3년차 백엔드 개발자입니다.\n문제 해결을 좋아합니다.";

  it("문장 안에 들어 있는 단어는 경계가 아니다", () => {
    const text = "저는 경력이 많고 다양한 경험과 기술을 가졌습니다.";
    expect(extractSelfIntroduction(`자기소개\n${text}\n${body}`)).toBe(`${text}\n${body}`);
  });

  it("흔한 한 단어가 장식·빈 줄 없이 한 줄로 나오면 경계가 아니다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n경험\n더 많은 이야기`)).toBe(`${body}\n경험\n더 많은 이야기`);
  });

  it("글머리(-, •)가 붙은 한 단어는 목록으로 보고 경계가 아니다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n- 경험\n- 활동`)).toBe(`${body}\n- 경험\n- 활동`);
  });

  it("흔한 한 단어도 앞에 빈 줄이 있으면 다음 섹션이다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n\n경험\n내용`)).toBe(body);
  });

  it.each(["## 경험", "[활동]", "활동:", "■ 링크", "【인턴】"])(
    "제목 모양 장식이 붙은 '%s'는 빈 줄이 없어도 다음 섹션이다",
    (heading) => {
      expect(extractSelfIntroduction(`자기소개\n${body}\n${heading}\n내용`)).toBe(body);
    },
  );

  it("합성어 제목은 빈 줄·장식 없이도 경계다", () => {
    expect(extractSelfIntroduction(`자기소개\n${body}\n업무 경험\n내용`)).toBe(body);
    expect(extractSelfIntroduction(`자기소개\n${body}\nTechnical Skills\n내용`)).toBe(body);
  });
});
