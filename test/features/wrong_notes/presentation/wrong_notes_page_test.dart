import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note_repository.dart';
import 'package:my_app/features/wrong_notes/presentation/wrong_notes_page.dart';
import 'package:my_app/features/wrong_notes/presentation/wrong_notes_providers.dart';

class FakeWrongNoteRepository implements WrongNoteRepository {
  FakeWrongNoteRepository(List<WrongNote> initial) : _notes = List.of(initial);

  final List<WrongNote> _notes;

  @override
  Future<List<WrongNote>> fetchAll() async => List.unmodifiable(_notes);

  @override
  Future<void> save(WrongNote note) async {
    _notes.removeWhere((existing) => existing.questionId == note.questionId);
    _notes.add(note);
  }

  @override
  Future<void> setResolved(String questionId, bool isResolved) async {
    final index = _notes.indexWhere((note) => note.questionId == questionId);
    final existing = _notes[index];
    _notes[index] = WrongNote(
      questionId: existing.questionId,
      categoryId: existing.categoryId,
      questionPrompt: existing.questionPrompt,
      savedAt: existing.savedAt,
      isResolved: isResolved,
    );
  }

  @override
  Future<void> delete(String questionId) async {
    _notes.removeWhere((note) => note.questionId == questionId);
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

Widget _pageWith(WrongNoteRepository repository) {
  return ProviderScope(
    overrides: [wrongNoteRepositoryProvider.overrideWithValue(repository)],
    child: const MaterialApp(home: WrongNotesPage()),
  );
}

void main() {
  testWidgets('오답노트가 없으면 빈 상태 문구를 보여준다', (tester) async {
    await tester.pumpWidget(_pageWith(FakeWrongNoteRepository([])));
    await tester.pumpAndSettle();

    expect(find.text('아직 저장된 오답노트가 없습니다.'), findsOneWidget);
  });

  testWidgets('저장된 오답노트 목록을 보여준다', (tester) async {
    await tester.pumpWidget(_pageWith(FakeWrongNoteRepository([_note('q1')])));
    await tester.pumpAndSettle();

    expect(find.text('배열과 연결 리스트의 차이를 설명하라.'), findsOneWidget);
    expect(find.text('미해결'), findsOneWidget);
  });

  testWidgets('체크박스를 누르면 해결됨으로 바뀐다', (tester) async {
    await tester.pumpWidget(_pageWith(FakeWrongNoteRepository([_note('q1')])));
    await tester.pumpAndSettle();

    await tester.tap(find.byType(Checkbox));
    await tester.pumpAndSettle();

    expect(find.text('해결됨'), findsOneWidget);
  });

  testWidgets('삭제 버튼을 누르면 목록에서 사라진다', (tester) async {
    await tester.pumpWidget(_pageWith(FakeWrongNoteRepository([_note('q1')])));
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.delete_outline));
    await tester.pumpAndSettle();

    expect(find.text('아직 저장된 오답노트가 없습니다.'), findsOneWidget);
  });
}
