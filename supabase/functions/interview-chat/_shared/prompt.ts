export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_MAX_RESUME_CHARS = 4000;
const DEFAULT_MAX_JOB_POSTING_CHARS = 3000;
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

/** 채용공고 텍스트를 `MAX_JOB_POSTING_CHARS`(기본 3000자)로 자른다. */
export function truncateJobPosting(jobPosting: string): string {
  const max = readIntEnv('MAX_JOB_POSTING_CHARS', DEFAULT_MAX_JOB_POSTING_CHARS);
  return jobPosting.length > max ? jobPosting.slice(0, max) : jobPosting;
}

/** 대화 이력을 `MAX_HISTORY_MESSAGES`(기본 20개)로 최근 것만 남긴다. */
export function truncateHistory(history: HistoryMessage[]): HistoryMessage[] {
  const max = readIntEnv('MAX_HISTORY_MESSAGES', DEFAULT_MAX_HISTORY_MESSAGES);
  return history.length > max ? history.slice(history.length - max) : history;
}

export function buildSystemPrompt(params: {
  /** 예전 앱 버전만 보낸다. 없으면 지원 분야 줄을 넣지 않는다. */
  categoryName?: string;
  jobTitle: string;
  resumeText: string;
  /** 선택. 회사 채용공고 텍스트. */
  jobPosting?: string;
}): string {
  const jobPosting = params.jobPosting?.trim() ? truncateJobPosting(params.jobPosting.trim()) : null;
  const categoryName = params.categoryName?.trim();

  return [
    '당신은 개발자 기술 면접관입니다. 지원자의 이력서와 지원 직무를 참고해',
    ...(jobPosting ? ['채용공고의 요구 역량과 우대사항에 맞춰 질문하고,'] : []),
    '실제 면접처럼 한 번에 하나씩 질문하고, 답변에 따라 꼬리 질문을 이어가세요.',
    '답변은 한국어로, 간결하고 자연스러운 대화체로 작성하세요.',
    '',
    ...(categoryName ? [`지원 분야: ${categoryName}`] : []),
    `지원 직무: ${params.jobTitle}`,
    ...(jobPosting ? ['', '채용공고:', jobPosting] : []),
    '',
    '이력서:',
    truncateResume(params.resumeText),
  ].join('\n');
}

/**
 * 새 면접의 첫 메시지인지. 클라이언트는 매 요청에 이전 대화를 함께 보내므로, 이전 대화가 없으면
 * 사용자가 새 면접을 시작한 것이다. 회원 경로는 이때 이전 진행 중 세션을 끝내고 새 세션을 만든다.
 */
export function startsNewInterview(history: unknown): boolean {
  return !Array.isArray(history) || history.length === 0;
}
