export type Category = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type Question = {
  id: string;
  categoryId: string;
  type: string;
  prompt: string;
  modelAnswer: string | null;
  difficulty: string | null;
  tags: string[];
};

/** 날짜는 ISO 8601 문자열로 들고 다닌다(로컬 저장 형식과 같다). */
export type WrongNote = {
  questionId: string;
  categoryId: string;
  questionPrompt: string;
  savedAt: string;
  isResolved: boolean;
  resolvedAt: string | null;
};

export type ResumeSourceType = "paste" | "pdf";

export type Resume = {
  sourceType: ResumeSourceType;
  text: string;
  updatedAt: string;
};

export type MessageRole = "user" | "assistant";

export type InterviewMessage = {
  role: MessageRole;
  content: string;
  createdAt: string;
};

export type InterviewSession = {
  categorySlug: string;
  categoryName: string;
  jobTitle: string;
  messages: InterviewMessage[];
};

export type PracticeMode = "study" | "practice";

export function parsePracticeMode(value: string): PracticeMode | null {
  return value === "study" || value === "practice" ? value : null;
}
