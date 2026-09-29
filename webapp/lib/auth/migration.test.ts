import { describe, expect, it } from "vitest";
import type { Resume, WrongNote } from "@/lib/models";
import { migrateIfNeeded, type MigrationDeps } from "./migration";

function note(id: string): WrongNote {
  return {
    questionId: id,
    categoryId: "c1",
    questionPrompt: `문제 ${id}`,
    savedAt: "2026-09-29T00:00:00.000Z",
    isResolved: false,
    resolvedAt: null,
  };
}

const resume: Resume = { sourceType: "paste", text: "이력서", updatedAt: "2026-09-29T00:00:00.000Z" };

function setup(options: {
  notes?: WrongNote[];
  resume?: Resume | null;
  serverQuestionIds?: string[];
  serverHasResume?: boolean;
  migrated?: boolean;
  failUpsert?: boolean;
}) {
  const state = {
    notes: options.notes ?? [],
    resume: options.resume ?? null,
    migrated: options.migrated ?? false,
    uploadedNotes: [] as WrongNote[],
    insertedResume: null as Resume | null,
  };
  const deps: MigrationDeps = {
    gateway: {
      existingQuestionIds: async (ids) => new Set(ids.filter((id) => (options.serverQuestionIds ?? ids).includes(id))),
      upsertWrongNotesIgnoringDuplicates: async (_userId, notes) => {
        if (options.failUpsert) throw new Error("network");
        state.uploadedNotes.push(...notes);
      },
      hasResume: async () => options.serverHasResume ?? false,
      insertResume: async (_userId, value) => {
        state.insertedResume = value;
      },
    },
    local: {
      readWrongNotes: () => state.notes,
      deleteWrongNote: (id) => {
        state.notes = state.notes.filter((item) => item.questionId !== id);
      },
      readResume: () => state.resume,
      clearResume: () => {
        state.resume = null;
      },
    },
    flags: {
      isMigrated: () => state.migrated,
      markMigrated: () => {
        state.migrated = true;
      },
    },
  };
  return { state, deps };
}

describe("로컬→DB 이전 정책", () => {
  it("오답노트를 올리고 성공한 항목만 로컬에서 지운다", async () => {
    const { state, deps } = setup({ notes: [note("q1"), note("q2")] });
    await migrateIfNeeded("u1", deps);
    expect(state.uploadedNotes.map((item) => item.questionId)).toEqual(["q1", "q2"]);
    expect(state.notes).toEqual([]);
    expect(state.migrated).toBe(true);
  });

  it("서버에 없는 문제의 오답노트는 올리지도 지우지도 않고, 이전 완료 표시도 하지 않는다", async () => {
    const { state, deps } = setup({ notes: [note("q1"), note("gone")], serverQuestionIds: ["q1"] });
    await migrateIfNeeded("u1", deps);
    expect(state.uploadedNotes.map((item) => item.questionId)).toEqual(["q1"]);
    expect(state.notes.map((item) => item.questionId)).toEqual(["gone"]);
    expect(state.migrated).toBe(false);
  });

  it("업로드가 실패하면 로컬을 보존하고 예외를 밖으로 던지지 않는다", async () => {
    const { state, deps } = setup({ notes: [note("q1")], resume, failUpsert: true });
    await expect(migrateIfNeeded("u1", deps)).resolves.toBeUndefined();
    expect(state.notes).toHaveLength(1);
    expect(state.resume).toEqual(resume);
    expect(state.migrated).toBe(false);
  });

  it("이력서: 서버에 없으면 올리고 로컬을 비운다", async () => {
    const { state, deps } = setup({ resume });
    await migrateIfNeeded("u1", deps);
    expect(state.insertedResume).toEqual(resume);
    expect(state.resume).toBeNull();
    expect(state.migrated).toBe(true);
  });

  it("이력서: 서버 우선 - 서버에 이미 있으면 올리지도 지우지도 않는다", async () => {
    const { state, deps } = setup({ resume, serverHasResume: true });
    await migrateIfNeeded("u1", deps);
    expect(state.insertedResume).toBeNull();
    expect(state.resume).toEqual(resume);
    expect(state.migrated).toBe(false);
  });

  it("이미 이전 완료 표시가 있으면 아무것도 하지 않는다", async () => {
    const { state, deps } = setup({ notes: [note("q1")], migrated: true });
    await migrateIfNeeded("u1", deps);
    expect(state.uploadedNotes).toEqual([]);
    expect(state.notes).toHaveLength(1);
  });

  it("로컬이 비어 있으면 바로 완료 표시", async () => {
    const { state, deps } = setup({});
    await migrateIfNeeded("u1", deps);
    expect(state.migrated).toBe(true);
  });
});
