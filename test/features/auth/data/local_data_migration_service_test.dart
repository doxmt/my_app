import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/storage/local_json_store.dart';
import 'package:my_app/features/auth/data/local_data_migration_service.dart';
import 'package:my_app/features/auth/data/migration_flag_store.dart';
import 'package:my_app/features/auth/domain/migration_gateway.dart';
import 'package:my_app/features/resume/domain/resume.dart';
import 'package:my_app/features/resume/domain/resume_repository.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note_repository.dart';

class FakeLocalJsonStore implements LocalJsonStore {
  final Map<String, Map<String, dynamic>> data = {};

  @override
  Future<Map<String, dynamic>?> read(String key) async => data[key];

  @override
  Future<void> write(String key, Map<String, dynamic> value) async {
    data[key] = value;
  }
}

class FakeWrongNoteRepository implements WrongNoteRepository {
  final List<WrongNote> notes = [];

  @override
  Future<List<WrongNote>> fetchAll() async => List.of(notes);

  @override
  Future<void> save(WrongNote note) async => notes.add(note);

  @override
  Future<void> setResolved(String questionId, bool isResolved) async {}

  @override
  Future<void> delete(String questionId) async {
    notes.removeWhere((note) => note.questionId == questionId);
  }
}

class FakeResumeRepository implements ResumeRepository {
  Resume? resume;

  @override
  Future<Resume?> fetch() async => resume;

  @override
  Future<void> save(Resume value) async => resume = value;
}

class FakeMigrationFlagStore implements MigrationFlagStore {
  final Set<String> migrated = {};

  @override
  Future<bool> isMigrated(String userId) async => migrated.contains(userId);

  @override
  Future<void> markMigrated(String userId) async => migrated.add(userId);
}

class FakeMigrationGateway implements MigrationGateway {
  FakeMigrationGateway({
    this.validQuestionIds = const {},
    this.serverHasResume = false,
    this.throwOnUpsertWrongNotes = false,
  });

  final Set<String> validQuestionIds;
  bool serverHasResume;
  bool throwOnUpsertWrongNotes;

  List<WrongNote>? upsertedNotes;
  Resume? insertedResume;

  @override
  Future<Set<String>> existingQuestionIds(List<String> questionIds) async {
    return questionIds.where(validQuestionIds.contains).toSet();
  }

  @override
  Future<void> upsertWrongNotesIgnoringDuplicates(String userId, List<WrongNote> notes) async {
    if (throwOnUpsertWrongNotes) {
      throw Exception('network error');
    }
    upsertedNotes = notes;
  }

  @override
  Future<bool> hasResume(String userId) async => serverHasResume;

  @override
  Future<void> insertResume(String userId, Resume resume) async {
    insertedResume = resume;
  }
}

WrongNote _note(String questionId) {
  return WrongNote(
    questionId: questionId,
    categoryId: 'c1',
    questionPrompt: '문제 $questionId',
    savedAt: DateTime.utc(2026, 9, 18),
  );
}

void main() {
  group('오답노트 이전', () {
    test('서버에 존재하는 문제만 업로드하고 성공한 항목만 로컬에서 지운다', () async {
      final localNotes = FakeWrongNoteRepository()
        ..notes.addAll([_note('q1'), _note('q2')]);
      final gateway = FakeMigrationGateway(validQuestionIds: {'q1'});

      final service = LocalDataMigrationService(
        gateway: gateway,
        localWrongNoteRepository: localNotes,
        localResumeRepository: FakeResumeRepository(),
        localJsonStore: FakeLocalJsonStore(),
        flagStore: FakeMigrationFlagStore(),
      );

      await service.migrateIfNeeded('user-1');

      expect(gateway.upsertedNotes?.map((n) => n.questionId), ['q1']);
      expect(localNotes.notes.map((n) => n.questionId), ['q2']);
    });

    test('부분 실패 시 업로드를 시도하지 못했으므로 로컬 데이터를 보존한다', () async {
      final localNotes = FakeWrongNoteRepository()..notes.add(_note('q1'));
      final gateway = FakeMigrationGateway(
        validQuestionIds: {'q1'},
        throwOnUpsertWrongNotes: true,
      );
      final flagStore = FakeMigrationFlagStore();

      final service = LocalDataMigrationService(
        gateway: gateway,
        localWrongNoteRepository: localNotes,
        localResumeRepository: FakeResumeRepository(),
        localJsonStore: FakeLocalJsonStore(),
        flagStore: flagStore,
      );

      await service.migrateIfNeeded('user-1');

      expect(localNotes.notes, hasLength(1));
      expect(await flagStore.isMigrated('user-1'), isFalse);
    });
  });

  group('이력서 이전', () {
    test('서버에 이력서가 없으면 업로드하고 로컬을 비운다', () async {
      final jsonStore = FakeLocalJsonStore();
      final localResume = FakeResumeRepository()
        ..resume = Resume(
          sourceType: ResumeSourceType.paste,
          text: '3년차 백엔드 개발자',
          updatedAt: DateTime.utc(2026, 9, 18),
        );
      final gateway = FakeMigrationGateway(serverHasResume: false);

      final service = LocalDataMigrationService(
        gateway: gateway,
        localWrongNoteRepository: FakeWrongNoteRepository(),
        localResumeRepository: localResume,
        localJsonStore: jsonStore,
        flagStore: FakeMigrationFlagStore(),
      );

      await service.migrateIfNeeded('user-1');

      expect(gateway.insertedResume?.text, '3년차 백엔드 개발자');
      expect(jsonStore.data['resume'], {'version': 1, 'items': []});
    });

    test('서버 우선: 서버에 이미 이력서가 있으면 로컬을 올리지도 지우지도 않는다', () async {
      final jsonStore = FakeLocalJsonStore();
      final localResume = FakeResumeRepository()
        ..resume = Resume(
          sourceType: ResumeSourceType.paste,
          text: '로컬 이력서',
          updatedAt: DateTime.utc(2026, 9, 18),
        );
      final gateway = FakeMigrationGateway(serverHasResume: true);

      final service = LocalDataMigrationService(
        gateway: gateway,
        localWrongNoteRepository: FakeWrongNoteRepository(),
        localResumeRepository: localResume,
        localJsonStore: jsonStore,
        flagStore: FakeMigrationFlagStore(),
      );

      await service.migrateIfNeeded('user-1');

      expect(gateway.insertedResume, isNull);
      expect(jsonStore.data.containsKey('resume'), isFalse);
      expect(localResume.resume?.text, '로컬 이력서');
    });
  });

  group('이전 플래그', () {
    test('로컬 데이터가 모두 비면 이전 완료로 표시하고 다음 호출에서는 게이트웨이를 부르지 않는다', () async {
      final localNotes = FakeWrongNoteRepository()..notes.add(_note('q1'));
      final gateway = FakeMigrationGateway(validQuestionIds: {'q1'});
      final flagStore = FakeMigrationFlagStore();

      final service = LocalDataMigrationService(
        gateway: gateway,
        localWrongNoteRepository: localNotes,
        localResumeRepository: FakeResumeRepository(),
        localJsonStore: FakeLocalJsonStore(),
        flagStore: flagStore,
      );

      await service.migrateIfNeeded('user-1');
      expect(await flagStore.isMigrated('user-1'), isTrue);

      gateway.upsertedNotes = null;
      await service.migrateIfNeeded('user-1');
      expect(gateway.upsertedNotes, isNull);
    });
  });
}
