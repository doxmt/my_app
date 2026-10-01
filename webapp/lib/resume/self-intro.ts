/**
 * 자기소개 최대 길이. 입력 제한과 추출 결과 자르기에 같이 쓴다.
 * 앱(`lib/features/resume/domain/self_intro_extractor.dart`)과 규칙·상수를 맞춘다.
 */
export const MAX_SELF_INTRODUCTION_CHARS = 1500;

const SELF_INTRO_TITLES = new Set([
  "자기소개",
  "자기소개서",
  "소개",
  "self introduction",
  "about",
  "about me",
  "summary",
  "profile",
]);

const SECTION_TITLES = new Set([
  "경력",
  "경력사항",
  "학력",
  "학력사항",
  "프로젝트",
  "기술",
  "기술 스택",
  "기술스택",
  "스킬",
  "자격증",
  "수상",
  "교육",
  "활동",
  "연락처",
  "experience",
  "work experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "awards",
  "contact",
]);

const LEADING_DECORATION = /^[\s#■●▶◆▪•\-*[(【]+/;
const TRAILING_DECORATION = /[\s:：\])】]+$/;

/** 줄에서 장식(공백, `#`, 글머리 기호, 괄호, 끝의 `:`)을 벗기고 소문자로 바꾼 제목 후보. */
function normalizeHeading(line: string): string {
  return line
    .replace(LEADING_DECORATION, "")
    .replace(TRAILING_DECORATION, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/**
 * 이력서 텍스트에서 "자기소개" 항목 본문을 뽑는다. 제목 줄이 없거나 본문이 비면 빈 문자열.
 * 제목 줄 다음부터 다음 섹션 제목 줄 직전까지를 가져오고 `MAX_SELF_INTRODUCTION_CHARS`자에서 자른다.
 */
export function extractSelfIntroduction(resumeText: string): string {
  const lines = resumeText.split(/\r?\n/);
  const titleIndex = lines.findIndex((line) => SELF_INTRO_TITLES.has(normalizeHeading(line)));
  if (titleIndex === -1) return "";

  const body: string[] = [];
  for (const line of lines.slice(titleIndex + 1)) {
    if (SECTION_TITLES.has(normalizeHeading(line))) break;
    body.push(line);
  }

  return body.join("\n").trim().slice(0, MAX_SELF_INTRODUCTION_CHARS);
}
