import type { InterviewMessage, InterviewSession, Resume, WrongNote } from "@/lib/models";

/** Flutter 앱(`LocalJsonStore`)과 같은 키·형식: 각 값은 `{ version: 1, items: [...] }`. */
const SCHEMA_VERSION = 1;

export const STORE_KEYS = {
  wrongNotes: "wrong_notes",
  resume: "resume",
  interviewSession: "interview_session",
} as const;

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

/** 브라우저에서만 localStorage를 돌려준다. SSR·접근 차단 환경에서는 null. */
export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readItems(key: string, storage: KeyValueStorage | null): unknown[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (raw === null) return [];
    const json: unknown = JSON.parse(raw);
    if (typeof json !== "object" || json === null) return [];
    const { version, items } = json as { version?: unknown; items?: unknown };
    if (version !== SCHEMA_VERSION || !Array.isArray(items)) return [];
    return items;
  } catch {
    return [];
  }
}

function writeItems(key: string, items: unknown[], storage: KeyValueStorage | null) {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify({ version: SCHEMA_VERSION, items }));
  } catch {
    // 용량 초과·차단 환경에서는 저장을 포기한다.
  }
}

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  if (typeof value !== "string") throw new Error("string expected");
  return value;
}

function nullableStr(value: unknown): string | null {
  return value === null || value === undefined ? null : str(value);
}

function wrongNoteFromJson(json: unknown): WrongNote {
  if (!isObject(json)) throw new Error("object expected");
  return {
    questionId: str(json.question_id),
    categoryId: str(json.category_id),
    questionPrompt: str(json.question_prompt),
    savedAt: str(json.saved_at),
    isResolved: json.is_resolved === true,
    resolvedAt: nullableStr(json.resolved_at),
  };
}

function wrongNoteToJson(note: WrongNote): Json {
  return {
    question_id: note.questionId,
    category_id: note.categoryId,
    question_prompt: note.questionPrompt,
    saved_at: note.savedAt,
    is_resolved: note.isResolved,
    resolved_at: note.resolvedAt,
  };
}

function resumeFromJson(json: unknown): Resume {
  if (!isObject(json)) throw new Error("object expected");
  const sourceType = str(json.source_type);
  if (sourceType !== "paste" && sourceType !== "pdf") throw new Error("invalid source_type");
  return {
    sourceType,
    text: str(json.text),
    updatedAt: str(json.updated_at),
    // 예전에 저장된 데이터에는 없다.
    selfIntroduction: typeof json.self_introduction === "string" ? json.self_introduction : "",
  };
}

function resumeToJson(resume: Resume): Json {
  return {
    source_type: resume.sourceType,
    text: resume.text,
    updated_at: resume.updatedAt,
    ...(resume.selfIntroduction ? { self_introduction: resume.selfIntroduction } : {}),
  };
}

function messageFromJson(json: unknown): InterviewMessage {
  if (!isObject(json)) throw new Error("object expected");
  const role = str(json.role);
  if (role !== "user" && role !== "assistant") throw new Error("invalid role");
  return { role, content: str(json.content), createdAt: str(json.created_at) };
}

function sessionFromJson(json: unknown): InterviewSession {
  if (!isObject(json)) throw new Error("object expected");
  const messages = Array.isArray(json.messages) ? json.messages : [];
  return {
    // 예전 버전에는 category_slug/category_name이 함께 저장돼 있었다. 지금은 쓰지 않아 읽지 않는다.
    jobTitle: str(json.job_title),
    jobPosting: typeof json.job_posting === "string" ? json.job_posting : "",
    messages: messages.map(messageFromJson),
  };
}

function sessionToJson(session: InterviewSession): Json {
  return {
    job_title: session.jobTitle,
    ...(session.jobPosting ? { job_posting: session.jobPosting } : {}),
    messages: session.messages.map((message) => ({
      role: message.role,
      content: message.content,
      created_at: message.createdAt,
    })),
  };
}

function parseAll<T>(items: unknown[], parse: (item: unknown) => T): T[] {
  const result: T[] = [];
  for (const item of items) {
    try {
      result.push(parse(item));
    } catch {
      // 형식이 맞지 않는 항목은 건너뛴다.
    }
  }
  return result;
}

export function readWrongNotes(storage: KeyValueStorage | null = getBrowserStorage()): WrongNote[] {
  return parseAll(readItems(STORE_KEYS.wrongNotes, storage), wrongNoteFromJson);
}

export function writeWrongNotes(notes: WrongNote[], storage: KeyValueStorage | null = getBrowserStorage()) {
  writeItems(STORE_KEYS.wrongNotes, notes.map(wrongNoteToJson), storage);
}

export function readResume(storage: KeyValueStorage | null = getBrowserStorage()): Resume | null {
  return parseAll(readItems(STORE_KEYS.resume, storage), resumeFromJson)[0] ?? null;
}

export function writeResume(resume: Resume | null, storage: KeyValueStorage | null = getBrowserStorage()) {
  writeItems(STORE_KEYS.resume, resume ? [resumeToJson(resume)] : [], storage);
}

export function readInterviewSession(
  storage: KeyValueStorage | null = getBrowserStorage(),
): InterviewSession | null {
  return parseAll(readItems(STORE_KEYS.interviewSession, storage), sessionFromJson)[0] ?? null;
}

export function writeInterviewSession(
  session: InterviewSession | null,
  storage: KeyValueStorage | null = getBrowserStorage(),
) {
  writeItems(STORE_KEYS.interviewSession, session ? [sessionToJson(session)] : [], storage);
}
