export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_MAX_RESUME_CHARS = 4000;
const DEFAULT_MAX_HISTORY_MESSAGES = 20;

function readIntEnv(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** 이력서 텍스트를 `MAX_RESUME_CHARS`(기본 4000자)로 자른다. */
export function truncateResume(resumeText: string): string {
  const max = readIntEnv('MAX_RESUME_CHARS', DEFAULT_MAX_RESUME_CHARS);
  return resumeText.length > max ? resumeText.slice(0, max) : resumeText;
}

/** 대화 이력을 `MAX_HISTORY_MESSAGES`(기본 20개)로 최근 것만 남긴다. */
export function truncateHistory(history: HistoryMessage[]): HistoryMessage[] {
  const max = readIntEnv('MAX_HISTORY_MESSAGES', DEFAULT_MAX_HISTORY_MESSAGES);
  return history.length > max ? history.slice(history.length - max) : history;
}

export function buildSystemPrompt(params: {
  categoryName: string;
  jobTitle: string;
  resumeText: string;
}): string {
  return [
    '당신은 개발자 기술 면접관입니다. 지원자의 이력서와 지원 분야를 참고해',
    '실제 면접처럼 한 번에 하나씩 질문하고, 답변에 따라 꼬리 질문을 이어가세요.',
    '답변은 한국어로, 간결하고 자연스러운 대화체로 작성하세요.',
    '',
    `지원 분야: ${params.categoryName}`,
    `지원 직무: ${params.jobTitle}`,
    '',
    '이력서:',
    truncateResume(params.resumeText),
  ].join('\n');
}
