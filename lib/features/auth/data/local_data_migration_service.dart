// ignore_for_file: prefer_initializing_formals
// (공개 생성자 파라미터 이름을 private 필드 이름과 다르게 유지하기 위해 의도적으로 사용하지 않는다.)
import '../../../core/storage/local_json_store.dart';
import '../../resume/domain/resume_repository.dart';
import '../../wrong_notes/domain/wrong_note_repository.dart';
import '../domain/migration_gateway.dart';
import 'migration_flag_store.dart';

/// `local_resume_repository.dart`의 저장 키와 맞춘다. ResumeRepository 인터페이스에는
/// 로컬 전용 삭제 메서드를 추가하지 않고, 이 서비스에서만 LocalJsonStore를 직접 비운다.
const _resumeStoreKey = 'resume';
const _resumeSchemaVersion = 1;

/// 로그인 성공 직후 기기의 오답노트·이력서를 계정으로 옮긴다.
///
/// 실패해도 예외를 밖으로 던지지 않는다 — 로그인은 항상 성공 처리되고,
/// 남은 로컬 데이터는 다음 로그인 시도(재시작 복원 포함)에서 재업로드를 시도한다.
class LocalDataMigrationService {
  LocalDataMigrationService({
    required MigrationGateway gateway,
    required WrongNoteRepository localWrongNoteRepository,
    required ResumeRepository localResumeRepository,
    required LocalJsonStore localJsonStore,
    required MigrationFlagStore flagStore,
  }) : _gateway = gateway,
       _localWrongNotes = localWrongNoteRepository,
       _localResume = localResumeRepository,
       _localJsonStore = localJsonStore,
       _flagStore = flagStore;

  final MigrationGateway _gateway;
  final WrongNoteRepository _localWrongNotes;
  final ResumeRepository _localResume;
  final LocalJsonStore _localJsonStore;
  final MigrationFlagStore _flagStore;

  Future<void> migrateIfNeeded(String userId) async {
    if (await _flagStore.isMigrated(userId)) {
      return;
    }
    try {
      await _migrateWrongNotes(userId);
      await _migrateResume(userId);
    } catch (_) {
      // 부분 실패는 무시한다. 남은 로컬 데이터가 다음 시도에서 재업로드된다.
    }
    if (await _isLocalDataEmpty()) {
      await _flagStore.markMigrated(userId);
    }
  }

  Future<bool> _isLocalDataEmpty() async {
    final notes = await _localWrongNotes.fetchAll();
    final resume = await _localResume.fetch();
    return notes.isEmpty && resume == null;
  }

  /// `unique(user_id, question_id)` 기준 중복 무시 병합. 업로드에 성공한 항목만 로컬에서 지운다.
  Future<void> _migrateWrongNotes(String userId) async {
    final notes = await _localWrongNotes.fetchAll();
    if (notes.isEmpty) {
      return;
    }

    final validQuestionIds = await _gateway.existingQuestionIds(
      notes.map((note) => note.questionId).toList(),
    );
    final uploadable = notes.where((note) => validQuestionIds.contains(note.questionId)).toList();
    if (uploadable.isEmpty) {
      return;
    }

    await _gateway.upsertWrongNotesIgnoringDuplicates(userId, uploadable);

    for (final note in uploadable) {
      await _localWrongNotes.delete(note.questionId);
    }
  }

  /// 서버 우선: 서버에 이미 이력서가 있으면 로컬을 올리지도 지우지도 않는다.
  Future<void> _migrateResume(String userId) async {
    final local = await _localResume.fetch();
    if (local == null) {
      return;
    }

    if (await _gateway.hasResume(userId)) {
      return;
    }

    await _gateway.insertResume(userId, local);
    await _localJsonStore.write(_resumeStoreKey, {'version': _resumeSchemaVersion, 'items': []});
  }
}
