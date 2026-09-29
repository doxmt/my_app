import type { Resume, WrongNote } from "@/lib/models";

/** 서버 쪽에서 필요한 최소 동작. Flutter `MigrationGateway`와 같은 모양. */
export interface MigrationGateway {
  /** 넘겨받은 questionId 중 실제로 `questions`에 있는 것만 돌려준다. */
  existingQuestionIds(questionIds: string[]): Promise<Set<string>>;
  /** `unique(user_id, question_id)` 충돌 시 서버 값을 유지하고 무시한다. */
  upsertWrongNotesIgnoringDuplicates(userId: string, notes: WrongNote[]): Promise<void>;
  hasResume(userId: string): Promise<boolean>;
  insertResume(userId: string, resume: Resume): Promise<void>;
}

export interface LocalMigrationSource {
  readWrongNotes(): WrongNote[];
  deleteWrongNote(questionId: string): void;
  readResume(): Resume | null;
  clearResume(): void;
}

/** 계정별로 이전이 끝났는지 기록해, 토큰 갱신·재방문마다 전체 업로드가 돌지 않게 한다. */
export interface MigrationFlagStore {
  isMigrated(userId: string): boolean;
  markMigrated(userId: string): void;
}

export type MigrationDeps = {
  gateway: MigrationGateway;
  local: LocalMigrationSource;
  flags: MigrationFlagStore;
};

/**
 * 로그인 직후 기기의 오답노트·이력서를 계정으로 옮긴다(`local_data_migration_service.dart`와 같은 정책).
 * 실패해도 예외를 밖으로 던지지 않는다. 남은 로컬 데이터는 다음 시도에서 재업로드된다.
 */
export async function migrateIfNeeded(userId: string, deps: MigrationDeps): Promise<void> {
  if (deps.flags.isMigrated(userId)) return;

  try {
    await migrateWrongNotes(userId, deps);
    await migrateResume(userId, deps);
  } catch {
    // 부분 실패는 무시한다.
  }

  if (deps.local.readWrongNotes().length === 0 && deps.local.readResume() === null) {
    deps.flags.markMigrated(userId);
  }
}

/** 중복 무시 병합. 업로드에 성공한 항목만 로컬에서 지운다. */
async function migrateWrongNotes(userId: string, { gateway, local }: MigrationDeps) {
  const notes = local.readWrongNotes();
  if (notes.length === 0) return;

  const valid = await gateway.existingQuestionIds(notes.map((note) => note.questionId));
  const uploadable = notes.filter((note) => valid.has(note.questionId));
  if (uploadable.length === 0) return;

  await gateway.upsertWrongNotesIgnoringDuplicates(userId, uploadable);

  for (const note of uploadable) {
    local.deleteWrongNote(note.questionId);
  }
}

/** 서버 우선: 서버에 이미 이력서가 있으면 로컬을 올리지도 지우지도 않는다. */
async function migrateResume(userId: string, { gateway, local }: MigrationDeps) {
  const resume = local.readResume();
  if (resume === null) return;
  if (await gateway.hasResume(userId)) return;

  await gateway.insertResume(userId, resume);
  local.clearResume();
}
