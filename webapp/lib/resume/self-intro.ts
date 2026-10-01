/**
 * 자기소개 최대 길이. 입력 제한과 추출 결과 자르기에 같이 쓴다.
 * 앱(`lib/features/resume/domain/self_intro_extractor.dart`)과 규칙·상수를 맞춘다.
 */
export const MAX_SELF_INTRODUCTION_CHARS = 1500;

// 제목 비교는 띄어쓰기를 모두 없앤 소문자 형태로 한다(예: "업무 경험"과 "업무경험"을 같게 본다).
const SELF_INTRO_TITLES = new Set([
  "자기소개",
  "자기소개서",
  "소개",
  "selfintroduction",
  "about",
  "aboutme",
  "summary",
  "profile",
]);

// 제목일 가능성이 매우 높은 말(합성어, 이력서 기본 섹션명). 줄 전체가 이것이면 어디서든 다음 섹션의 시작으로 본다.
const STRONG_SECTION_TITLES = new Set([
  "경력사항",
  "경력기술",
  "경력기술서",
  "주요경력",
  "총경력",
  "업무경험",
  "업무경력",
  "업무이력",
  "직무경험",
  "직무경력",
  "실무경험",
  "실무경력",
  "근무경력",
  "근무이력",
  "재직경력",
  "사회경력",
  "프로젝트경험",
  "프로젝트경력",
  "프로젝트이력",
  "주요프로젝트",
  "수행프로젝트",
  "개인프로젝트",
  "팀프로젝트",
  "사이드프로젝트",
  "학력사항",
  "학력및교육",
  "학력및자격",
  "교육사항",
  "교육이수",
  "교육이력",
  "교육및훈련",
  "교육과정",
  "기술스택",
  "기술역량",
  "기술능력",
  "기술사항",
  "기술소개",
  "보유기술",
  "보유스킬",
  "핵심기술",
  "핵심역량",
  "주요기술",
  "사용기술",
  "자격사항",
  "자격및면허",
  "자격및수상",
  "자격면허",
  "수상경력",
  "수상내역",
  "수상및자격",
  "대외활동",
  "대외경험",
  "활동사항",
  "활동및경험",
  "경험및활동",
  "동아리활동",
  "봉사활동",
  "인턴경험",
  "인턴경력",
  "인턴십",
  "어학능력",
  "어학사항",
  "외국어",
  "병역사항",
  "인적사항",
  "개인정보",
  "기본정보",
  "기본인적사항",
  "연락처",
  "포트폴리오",
  "오픈소스",
  "오픈소스기여",
  "블로그",
  "기타사항",
  "기타활동",
  "기타경험",
  "참고사항",
  "workexperience",
  "professionalexperience",
  "relevantexperience",
  "employmenthistory",
  "workhistory",
  "careerhistory",
  "technicalskills",
  "techskills",
  "techstack",
  "technologies",
  "keyskills",
  "coreskills",
  "skillset",
  "certifications",
  "licenses",
  "honorsandawards",
  "awardsandhonors",
  "publications",
  "opensource",
  "opensourcecontributions",
  "volunteerexperience",
  "volunteering",
  "references",
  "personalinformation",
  "contactinformation",
  "personalprojects",
  "sideprojects",
  "selectedprojects",
  "educationandtraining",
  "internships",
  "internship",
  "경력",
  "학력",
  "프로젝트",
  "자격증",
  "수상",
  "교육",
  "기술",
  "스킬",
  "어학",
  "experience",
  "education",
  "skills",
  "projects",
  "awards",
  "certificates",
  "languages",
  "contact",
  "portfolio",
]);

// 본문 속 한 줄로도 나올 수 있는 흔한 한 단어. 앞에 빈 줄이 있거나 제목 모양 장식(#, ■, [ ], 끝의 :)이 붙었을 때만 시작으로 본다.
const WEAK_SECTION_TITLES = new Set([
  "경험",
  "활동",
  "인턴",
  "링크",
  "links",
  "activities",
]);

// 날짜(년.월)만 있는 줄, 또는 "2026.06 - 2026.08 / 현재" 같은 기간 줄. 경력 항목이 시작됐다는 신호로 본다.
const DATE_ONLY_LINE = /^[-~–\s]*\d{4}\s*[./-]\s*\d{1,2}(\s*[./-]\s*\d{1,2})?(\s*[-~–]\s*(\d{4}\s*[./-]\s*\d{1,2}|현재|재직\s*중|present))?\s*$/i;

// 제목 모양 장식: 앞의 # ■ ● ▶ ◆ ▪ [ ( 【 또는 끝의 : ） ] ) 】. (글머리 `-`, `*`, `•`는 목록일 수 있어 제외한다)
const HEADING_STYLE = /^[#■●▶◆▪[(【]|[:：\])】]$/;

const LEADING_DECORATION = /^[\s#■●▶◆▪•\-*[(【]+/;
const TRAILING_DECORATION = /[\s:：\])】]+$/;

/** 줄에서 장식(공백, `#`, 글머리 기호, 괄호, 끝의 `:`)과 띄어쓰기를 벗기고 소문자로 바꾼 제목 후보. */
function normalizeHeading(line: string): string {
  return line
    .replace(LEADING_DECORATION, "")
    .replace(TRAILING_DECORATION, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/** `lines[index]`가 다음 섹션(또는 경력 항목)의 시작인지. */
function isSectionStart(lines: string[], index: number): boolean {
  const line = lines[index];
  if (DATE_ONLY_LINE.test(line)) return true;
  const key = normalizeHeading(line);
  if (STRONG_SECTION_TITLES.has(key)) return true;
  if (WEAK_SECTION_TITLES.has(key)) {
    const afterBlankLine = index > 0 && lines[index - 1].trim() === "";
    return afterBlankLine || HEADING_STYLE.test(line.trim());
  }
  return false;
}

/**
 * 이력서 텍스트에서 "자기소개" 항목 본문을 뽑는다. 제목 줄이 없거나 본문이 비면 빈 문자열.
 * 제목 줄 다음부터 다음 섹션 제목 줄(또는 날짜만 있는 줄) 직전까지를 가져오고 `MAX_SELF_INTRODUCTION_CHARS`자에서 자른다.
 */
export function extractSelfIntroduction(resumeText: string): string {
  const lines = resumeText.split(/\r?\n/);
  const titleIndex = lines.findIndex((line) => SELF_INTRO_TITLES.has(normalizeHeading(line)));
  if (titleIndex === -1) return "";

  const body: string[] = [];
  for (let index = titleIndex + 1; index < lines.length; index += 1) {
    if (isSectionStart(lines, index)) break;
    body.push(lines[index]);
  }

  return body.join("\n").trim().slice(0, MAX_SELF_INTRODUCTION_CHARS);
}
