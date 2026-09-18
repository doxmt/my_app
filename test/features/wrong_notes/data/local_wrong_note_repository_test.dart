import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/storage/local_json_store.dart';
import 'package:my_app/features/wrong_notes/data/local_wrong_note_repository.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note.dart';

/// in-memory fake. Supabase 없이 저장 로직만 검증한다.
class FakeLocalJsonStore implements LocalJsonStore {
  final Map<String, Map<String, dynamic>> _data = {};

  @override
  Future<Map<String, dynamic>?> read(String key) async => _data[key];

  @override
  Future<void> write(String key, Map<String, dynamic> value) async {
    _data[key] = value;
  }
}

WrongNote _note(String questionId, {bool isResolved = false}) {
  return WrongNote(
    questionId: questionId,
    categoryId: 'c1',
    questionPrompt: '배열과 연결 리스트의 차이를 설명하라.',
    savedAt: DateTime.utc(2026, 9, 18),
    isResolved: isResolved,
  );
}

void main() {
  test('저장한 항목이 fetchAll에 나타난다', () async {
    final repository = LocalWrongNoteRepository(FakeLocalJsonStore());

    await repository.save(_note('q1'));
    final notes = await repository.fetchAll();

    expect(notes, hasLength(1));
    expect(notes.single.questionId, 'q1');
  });

  test('같은 questionId를 두 번 저장하면 덮어쓴다', () async {
    final repository = LocalWrongNoteRepository(FakeLocalJsonStore());

    await repository.save(_note('q1'));
    await repository.save(_note('q1'));
    final notes = await repository.fetchAll();

    expect(notes, hasLength(1));
  });

  test('setResolved(true)로 해결 처리하면 resolvedAt이 채워진다', () async {
    final repository = LocalWrongNoteRepository(FakeLocalJsonStore());
    await repository.save(_note('q1'));

    await repository.setResolved('q1', true);
    final notes = await repository.fetchAll();

    expect(notes.single.isResolved, isTrue);
    expect(notes.single.resolvedAt, isNotNull);
  });

  test('setResolved(false)로 되돌리면 resolvedAt이 비워진다', () async {
    final repository = LocalWrongNoteRepository(FakeLocalJsonStore());
    await repository.save(_note('q1'));
    await repository.setResolved('q1', true);

    await repository.setResolved('q1', false);
    final notes = await repository.fetchAll();

    expect(notes.single.isResolved, isFalse);
    expect(notes.single.resolvedAt, isNull);
  });

  test('delete로 항목을 지운다', () async {
    final repository = LocalWrongNoteRepository(FakeLocalJsonStore());
    await repository.save(_note('q1'));

    await repository.delete('q1');
    final notes = await repository.fetchAll();

    expect(notes, isEmpty);
  });

  test('새 저장소 인스턴스로 다시 읽어도 데이터가 유지된다 (영속성 시뮬레이션)', () async {
    final store = FakeLocalJsonStore();
    await LocalWrongNoteRepository(store).save(_note('q1'));

    final notes = await LocalWrongNoteRepository(store).fetchAll();

    expect(notes, hasLength(1));
  });
}
