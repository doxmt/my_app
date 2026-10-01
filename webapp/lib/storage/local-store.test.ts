import { describe, expect, it } from "vitest";
import {
  readInterviewSession,
  readResume,
  readWrongNotes,
  writeInterviewSession,
  writeResume,
  writeWrongNotes,
  type KeyValueStorage,
} from "./local-store";

function fakeStorage(initial: Record<string, string> = {}): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const wrongNoteJson = {
  question_id: "q1",
  category_id: "c1",
  question_prompt: "프로세스와 스레드의 차이는?",
  saved_at: "2026-09-29T01:02:03.000",
  is_resolved: false,
  resolved_at: null,
};
const resumeJson = { source_type: "paste", text: "이력서 본문", updated_at: "2026-09-29T01:02:03.000" };
const sessionJson = {
  job_title: "백엔드 개발자",
  job_posting: "Kotlin, Spring 우대",
  messages: [{ role: "user", content: "안녕하세요", created_at: "2026-09-29T01:02:03.000" }],
};

describe("local-store (Flutter 호환 형식)", () => {
  it("wrong_notes: Flutter 형식 JSON을 읽고 같은 형식으로 쓴다", () => {
    const storage = fakeStorage({ wrong_notes: JSON.stringify({ version: 1, items: [wrongNoteJson] }) });
    const notes = readWrongNotes(storage);
    expect(notes).toEqual([
      {
        questionId: "q1",
        categoryId: "c1",
        questionPrompt: "프로세스와 스레드의 차이는?",
        savedAt: "2026-09-29T01:02:03.000",
        isResolved: false,
        resolvedAt: null,
      },
    ]);
    writeWrongNotes(notes, storage);
    expect(JSON.parse(storage.data.wrong_notes)).toEqual({ version: 1, items: [wrongNoteJson] });
  });

  it("resume: Flutter 형식 JSON을 읽고 같은 형식으로 쓴다", () => {
    const storage = fakeStorage({ resume: JSON.stringify({ version: 1, items: [resumeJson] }) });
    const resume = readResume(storage);
    expect(resume).toEqual({
      sourceType: "paste",
      text: "이력서 본문",
      updatedAt: "2026-09-29T01:02:03.000",
      selfIntroduction: "",
    });
    writeResume(resume, storage);
    expect(JSON.parse(storage.data.resume)).toEqual({ version: 1, items: [resumeJson] });
  });

  it("resume: 자기소개는 비어 있지 않을 때만 self_introduction 키로 쓰고 읽는다", () => {
    const storage = fakeStorage();
    writeResume(
      { sourceType: "paste", text: "이력서 본문", updatedAt: "2026-09-29T01:02:03.000", selfIntroduction: "안녕하세요" },
      storage,
    );
    expect(JSON.parse(storage.data.resume).items[0]).toEqual({ ...resumeJson, self_introduction: "안녕하세요" });
    expect(readResume(storage)?.selfIntroduction).toBe("안녕하세요");
  });

  it("resume: 자기소개가 없으면 키를 쓰지 않고 예전 데이터는 빈 문자열로 읽는다", () => {
    const storage = fakeStorage();
    writeResume(
      { sourceType: "paste", text: "이력서 본문", updatedAt: "2026-09-29T01:02:03.000", selfIntroduction: "" },
      storage,
    );
    expect(JSON.parse(storage.data.resume).items[0]).not.toHaveProperty("self_introduction");
    expect(readResume(storage)?.selfIntroduction).toBe("");
  });

  it("resume: null을 쓰면 빈 items를 남긴다", () => {
    const storage = fakeStorage();
    writeResume(null, storage);
    expect(JSON.parse(storage.data.resume)).toEqual({ version: 1, items: [] });
    expect(readResume(storage)).toBeNull();
  });

  it("interview_session: 분야 값이 들어 있던 예전 형식도 읽고, 채용공고가 없으면 job_posting을 쓰지 않는다", () => {
    const legacy = {
      category_slug: "backend",
      category_name: "백엔드",
      job_title: "백엔드 개발자",
      messages: [],
    };
    const storage = fakeStorage({ interview_session: JSON.stringify({ version: 1, items: [legacy] }) });
    const session = readInterviewSession(storage);
    expect(session?.jobTitle).toBe("백엔드 개발자");
    expect(session?.jobPosting).toBe("");
    writeInterviewSession(session, storage);
    expect(JSON.parse(storage.data.interview_session)).toEqual({
      version: 1,
      items: [{ job_title: "백엔드 개발자", messages: [] }],
    });
  });

  it("interview_session: Flutter 형식 JSON을 읽고 같은 형식으로 쓴다", () => {
    const storage = fakeStorage({ interview_session: JSON.stringify({ version: 1, items: [sessionJson] }) });
    const session = readInterviewSession(storage);
    expect(session?.jobTitle).toBe("백엔드 개발자");
    expect(session?.jobPosting).toBe("Kotlin, Spring 우대");
    expect(session?.messages[0]).toEqual({ role: "user", content: "안녕하세요", createdAt: "2026-09-29T01:02:03.000" });
    writeInterviewSession(session, storage);
    expect(JSON.parse(storage.data.interview_session)).toEqual({ version: 1, items: [sessionJson] });
  });

  it("키가 없으면 빈 값", () => {
    const storage = fakeStorage();
    expect(readWrongNotes(storage)).toEqual([]);
    expect(readResume(storage)).toBeNull();
    expect(readInterviewSession(storage)).toBeNull();
  });

  it("손상된 JSON은 예외 없이 빈 값", () => {
    const storage = fakeStorage({ wrong_notes: "{not json", resume: "[[[", interview_session: "null" });
    expect(readWrongNotes(storage)).toEqual([]);
    expect(readResume(storage)).toBeNull();
    expect(readInterviewSession(storage)).toBeNull();
  });

  it("버전이 다르거나 items가 배열이 아니면 빈 값", () => {
    const storage = fakeStorage({
      wrong_notes: JSON.stringify({ version: 2, items: [wrongNoteJson] }),
      resume: JSON.stringify({ version: 1, items: "oops" }),
    });
    expect(readWrongNotes(storage)).toEqual([]);
    expect(readResume(storage)).toBeNull();
  });

  it("형식이 잘못된 항목은 건너뛴다", () => {
    const storage = fakeStorage({
      wrong_notes: JSON.stringify({ version: 1, items: [{ question_id: 1 }, wrongNoteJson] }),
    });
    expect(readWrongNotes(storage)).toHaveLength(1);
  });

  it("스토리지가 없으면(SSR) 읽기는 빈 값, 쓰기는 무시", () => {
    expect(readWrongNotes(null)).toEqual([]);
    expect(() => writeWrongNotes([], null)).not.toThrow();
  });
});
