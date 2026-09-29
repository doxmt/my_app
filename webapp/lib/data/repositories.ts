import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resume, WrongNote } from "@/lib/models";
import {
  readResume,
  readWrongNotes,
  writeResume,
  writeWrongNotes,
} from "@/lib/storage/local-store";
import { remoteResume, remoteWrongNotes } from "./supabase-data";

/** 로그인 여부는 `userId` 하나로만 가른다: null이면 기기(localStorage), 있으면 Supabase. */
export type WrongNoteRepository = {
  fetchAll(): Promise<WrongNote[]>;
  /** 같은 questionId가 있으면 덮어쓴다. */
  save(note: WrongNote): Promise<void>;
  setResolved(questionId: string, isResolved: boolean): Promise<void>;
  delete(questionId: string): Promise<void>;
};

export type ResumeRepository = {
  fetch(): Promise<Resume | null>;
  save(resume: Resume): Promise<void>;
};

const localWrongNotes: WrongNoteRepository = {
  async fetchAll() {
    return readWrongNotes();
  },
  async save(note) {
    const notes = readWrongNotes().filter((existing) => existing.questionId !== note.questionId);
    writeWrongNotes([...notes, note]);
  },
  async setResolved(questionId, isResolved) {
    writeWrongNotes(
      readWrongNotes().map((note) =>
        note.questionId === questionId
          ? { ...note, isResolved, resolvedAt: isResolved ? new Date().toISOString() : null }
          : note,
      ),
    );
  },
  async delete(questionId) {
    writeWrongNotes(readWrongNotes().filter((note) => note.questionId !== questionId));
  },
};

const localResume: ResumeRepository = {
  async fetch() {
    return readResume();
  },
  async save(resume) {
    writeResume(resume);
  },
};

export function getWrongNoteRepository(userId: string | null, client: SupabaseClient): WrongNoteRepository {
  if (userId === null) return localWrongNotes;
  return {
    fetchAll: () => remoteWrongNotes.fetchAll(client, userId),
    save: (note) => remoteWrongNotes.save(client, userId, note),
    setResolved: (questionId, isResolved) => remoteWrongNotes.setResolved(client, userId, questionId, isResolved),
    delete: (questionId) => remoteWrongNotes.delete(client, userId, questionId),
  };
}

export function getResumeRepository(userId: string | null, client: SupabaseClient): ResumeRepository {
  if (userId === null) return localResume;
  return {
    fetch: () => remoteResume.fetch(client, userId),
    save: (resume) => remoteResume.save(client, userId, resume),
  };
}
