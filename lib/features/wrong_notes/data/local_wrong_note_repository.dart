import '../../../core/storage/local_json_store.dart';
import '../domain/wrong_note.dart';
import '../domain/wrong_note_repository.dart';

const _storeKey = 'wrong_notes';
const _schemaVersion = 1;

class LocalWrongNoteRepository implements WrongNoteRepository {
  LocalWrongNoteRepository(this._store);

  final LocalJsonStore _store;

  Future<List<WrongNote>> _readAll() async {
    final json = await _store.read(_storeKey);
    if (json == null) {
      return [];
    }
    final items = json['items'] as List<dynamic>? ?? const [];
    return items
        .map((item) => WrongNote.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _writeAll(List<WrongNote> notes) {
    return _store.write(_storeKey, {
      'version': _schemaVersion,
      'items': notes.map((note) => note.toJson()).toList(),
    });
  }

  @override
  Future<List<WrongNote>> fetchAll() => _readAll();

  @override
  Future<void> save(WrongNote note) async {
    final notes = await _readAll();
    notes.removeWhere((existing) => existing.questionId == note.questionId);
    notes.add(note);
    await _writeAll(notes);
  }

  @override
  Future<void> setResolved(String questionId, bool isResolved) async {
    final notes = await _readAll();
    final index = notes.indexWhere((note) => note.questionId == questionId);
    if (index == -1) {
      return;
    }
    final existing = notes[index];
    notes[index] = WrongNote(
      questionId: existing.questionId,
      categoryId: existing.categoryId,
      questionPrompt: existing.questionPrompt,
      savedAt: existing.savedAt,
      isResolved: isResolved,
      resolvedAt: isResolved ? DateTime.now() : null,
    );
    await _writeAll(notes);
  }

  @override
  Future<void> delete(String questionId) async {
    final notes = await _readAll();
    notes.removeWhere((note) => note.questionId == questionId);
    await _writeAll(notes);
  }
}
