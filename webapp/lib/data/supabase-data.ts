import type { SupabaseClient } from "@supabase/supabase-js";
import type { MigrationGateway } from "@/lib/auth/migration";
import type { Category, Question, Resume, WrongNote } from "@/lib/models";

type Row = Record<string, unknown>;

// embedding 등 무거운 컬럼은 가져오지 않는다.
const CATEGORY_COLUMNS = "id, parent_id, slug, name, description, sort_order";
const QUESTION_COLUMNS = "id, category_id, type, prompt, model_answer, difficulty, tags";

function categoryFromRow(row: Row): Category {
  return {
    id: row.id as string,
    parentId: (row.parent_id as string | null) ?? null,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    sortOrder: row.sort_order as number,
  };
}

function questionFromRow(row: Row): Question {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    type: row.type as string,
    prompt: row.prompt as string,
    modelAnswer: (row.model_answer as string | null) ?? null,
    difficulty: (row.difficulty as string | null) ?? null,
    tags: (row.tags as string[] | null) ?? [],
  };
}

/** 공개 데이터(`categories`, `questions`) 조회 전용. 쓰기는 하지 않는다. */
export async function fetchTopLevelCategories(client: SupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .is("parent_id", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(categoryFromRow);
}

export async function fetchChildCategories(client: SupabaseClient, parentId: string): Promise<Category[]> {
  const { data, error } = await client
    .from("categories")
    .select(CATEGORY_COLUMNS)
    .eq("parent_id", parentId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(categoryFromRow);
}

export async function fetchCategoryBySlug(client: SupabaseClient, slug: string): Promise<Category> {
  const { data, error } = await client.from("categories").select(CATEGORY_COLUMNS).eq("slug", slug).single();
  if (error) throw error;
  return categoryFromRow(data as Row);
}

export async function fetchQuestionsByCategory(client: SupabaseClient, categoryId: string): Promise<Question[]> {
  const { data, error } = await client
    .from("questions")
    .select(QUESTION_COLUMNS)
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(questionFromRow);
}

export async function fetchQuestionById(client: SupabaseClient, id: string): Promise<Question> {
  const { data, error } = await client.from("questions").select(QUESTION_COLUMNS).eq("id", id).single();
  if (error) throw error;
  return questionFromRow(data as Row);
}

/** 회원 오답노트 (`wrong_notes`, RLS 본인만). */
export const remoteWrongNotes = {
  async fetchAll(client: SupabaseClient, userId: string): Promise<WrongNote[]> {
    const { data, error } = await client
      .from("wrong_notes")
      .select("question_id, is_resolved, resolved_at, created_at, questions(category_id, prompt)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as Row[]).map((row) => {
      // to-one 관계지만 타입 추론이 배열일 수 있어 둘 다 받는다.
      const joined = row.questions as Row | Row[] | null;
      const question = Array.isArray(joined) ? joined[0] : joined;
      return {
        questionId: row.question_id as string,
        categoryId: (question?.category_id as string | undefined) ?? "",
        questionPrompt: (question?.prompt as string | undefined) ?? "",
        savedAt: row.created_at as string,
        isResolved: (row.is_resolved as boolean | null) ?? false,
        resolvedAt: (row.resolved_at as string | null) ?? null,
      };
    });
  },

  async save(client: SupabaseClient, userId: string, note: WrongNote) {
    const { error } = await client.from("wrong_notes").upsert(
      {
        user_id: userId,
        question_id: note.questionId,
        is_resolved: note.isResolved,
        resolved_at: note.resolvedAt,
      },
      { onConflict: "user_id,question_id" },
    );
    if (error) throw error;
  },

  async setResolved(client: SupabaseClient, userId: string, questionId: string, isResolved: boolean) {
    const { error } = await client
      .from("wrong_notes")
      .update({ is_resolved: isResolved, resolved_at: isResolved ? new Date().toISOString() : null })
      .eq("user_id", userId)
      .eq("question_id", questionId);
    if (error) throw error;
  },

  async delete(client: SupabaseClient, userId: string, questionId: string) {
    const { error } = await client.from("wrong_notes").delete().eq("user_id", userId).eq("question_id", questionId);
    if (error) throw error;
  },
};

const sourceTypeToDb = (type: Resume["sourceType"]) => (type === "paste" ? "text" : "pdf");

/** 회원 이력서 (`resumes`, RLS 본인만). */
export const remoteResume = {
  async fetch(client: SupabaseClient, userId: string): Promise<Resume | null> {
    const { data, error } = await client
      .from("resumes")
      .select("source_type, extracted_text, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = (data as Row[])[0];
    if (!row) return null;
    return {
      sourceType: row.source_type === "text" ? "paste" : "pdf",
      text: (row.extracted_text as string | null) ?? "",
      updatedAt: row.created_at as string,
    };
  },

  async save(client: SupabaseClient, userId: string, resume: Resume) {
    const { data: existing, error: lookupError } = await client
      .from("resumes")
      .select("id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (lookupError) throw lookupError;

    const payload = {
      user_id: userId,
      source_type: sourceTypeToDb(resume.sourceType),
      extracted_text: resume.text,
    };
    const id = (existing as Row[])[0]?.id as string | undefined;
    const { error } = id
      ? await client.from("resumes").update(payload).eq("id", id)
      : await client.from("resumes").insert(payload);
    if (error) throw error;
  },
};

export function createMigrationGateway(client: SupabaseClient): MigrationGateway {
  return {
    async existingQuestionIds(questionIds) {
      const { data, error } = await client.from("questions").select("id").in("id", questionIds);
      if (error) throw error;
      return new Set((data as Row[]).map((row) => row.id as string));
    },

    async upsertWrongNotesIgnoringDuplicates(userId, notes) {
      const { error } = await client.from("wrong_notes").upsert(
        notes.map((note) => ({
          user_id: userId,
          question_id: note.questionId,
          is_resolved: note.isResolved,
          resolved_at: note.resolvedAt,
          created_at: note.savedAt,
        })),
        { onConflict: "user_id,question_id", ignoreDuplicates: true },
      );
      if (error) throw error;
    },

    async hasResume(userId) {
      const { data, error } = await client.from("resumes").select("id").eq("user_id", userId).limit(1);
      if (error) throw error;
      return (data as Row[]).length > 0;
    },

    async insertResume(userId, resume) {
      const { error } = await client.from("resumes").insert({
        user_id: userId,
        source_type: sourceTypeToDb(resume.sourceType),
        extracted_text: resume.text,
      });
      if (error) throw error;
    },
  };
}
