import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/domain/category_repository.dart';
import 'package:my_app/features/categories/domain/field_stats.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/features/resume/domain/resume.dart';
import 'package:my_app/features/resume/domain/resume_repository.dart';
import 'package:my_app/features/resume/presentation/resume_providers.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note.dart';
import 'package:my_app/features/wrong_notes/domain/wrong_note_repository.dart';
import 'package:my_app/features/wrong_notes/presentation/wrong_notes_providers.dart';
import 'package:my_app/main.dart';

class FakeResumeRepository implements ResumeRepository {
  Resume? _resume;

  @override
  Future<Resume?> fetch() async => _resume;

  @override
  Future<void> save(Resume resume) async {
    _resume = resume;
  }
}

class FakeCategoryRepository implements CategoryRepository {
  FakeCategoryRepository(this._categories, {this.throwError = false});

  final List<Category> _categories;
  final bool throwError;

  @override
  Future<List<Category>> fetchTopLevelCategories() async {
    if (throwError) {
      throw Exception('network error');
    }
    return _categories;
  }

  @override
  Future<List<Category>> fetchChildCategories(String parentId) async {
    if (throwError) {
      throw Exception('network error');
    }
    return _categories.where((category) => category.parentId == parentId).toList();
  }

  @override
  Future<Category> fetchCategoryBySlug(String slug) async {
    if (throwError) {
      throw Exception('network error');
    }
    return _categories.firstWhere((category) => category.slug == slug);
  }

  @override
  Future<Map<String, FieldStats>> fetchFieldStats() async => const {'c1': FieldStats(topicCount: 2, questionCount: 6)};
}

class FakeWrongNoteRepository implements WrongNoteRepository {
  final List<WrongNote> _notes = [];

  @override
  Future<List<WrongNote>> fetchAll() async => _notes;

  @override
  Future<void> save(WrongNote note) async {
    _notes.removeWhere((existing) => existing.questionId == note.questionId);
    _notes.add(note);
  }

  @override
  Future<void> setResolved(String questionId, bool isResolved) async {}

  @override
  Future<void> delete(String questionId) async {
    _notes.removeWhere((note) => note.questionId == questionId);
  }
}

const _cs = Category(
  id: 'c1',
  parentId: null,
  slug: 'cs',
  name: 'CS',
  description: null,
  sortOrder: 1,
);

Widget _appWith(CategoryRepository repository) {
  return ProviderScope(
    overrides: [
      categoryRepositoryProvider.overrideWithValue(repository),
      wrongNoteRepositoryProvider.overrideWithValue(FakeWrongNoteRepository()),
      resumeRepositoryProvider.overrideWithValue(FakeResumeRepository()),
    ],
    child: const MyApp(),
  );
}

void main() {
  testWidgets('앱이 정상적으로 렌더링된다', (tester) async {
    await tester.pumpWidget(_appWith(FakeCategoryRepository(const [])));
    await tester.pumpAndSettle();

    expect(find.text('홈'), findsWidgets);
  });

  testWidgets('분야가 없으면 빈 상태 문구를 보여준다', (tester) async {
    await tester.pumpWidget(_appWith(FakeCategoryRepository(const [])));
    await tester.pumpAndSettle();

    expect(find.text('아직 등록된 분야가 없습니다.'), findsOneWidget);
  });

  testWidgets('분야가 있으면 목록을 보여준다', (tester) async {
    await tester.pumpWidget(_appWith(FakeCategoryRepository(const [_cs])));
    await tester.pumpAndSettle();

    expect(find.text('CS'), findsOneWidget);
    expect(find.text('주제 2 · 문제 6'), findsOneWidget);
  });

  testWidgets('네트워크 오류가 나면 에러 문구와 재시도 버튼을 보여준다', (tester) async {
    await tester.pumpWidget(
      _appWith(FakeCategoryRepository(const [], throwError: true)),
    );
    await tester.pumpAndSettle();

    expect(find.text('분야 목록을 불러오지 못했습니다.'), findsOneWidget);
    expect(find.text('다시 시도'), findsOneWidget);
  });

  testWidgets('하단 탭으로 홈/모의면접/내 정보를 오갈 수 있다', (tester) async {
    await tester.pumpWidget(_appWith(FakeCategoryRepository(const [])));
    await tester.pumpAndSettle();

    await tester.tap(find.text('모의면접'));
    await tester.pumpAndSettle();
    expect(find.text('모의면접을 시작하려면 이력서를 먼저 입력해주세요.'), findsOneWidget);

    await tester.tap(find.text('내 정보'));
    await tester.pumpAndSettle();
    expect(find.text('오답노트'), findsOneWidget);
  });

  testWidgets('내 정보에서 오답노트로 들어갔다가 뒤로 돌아올 수 있다', (tester) async {
    await tester.pumpWidget(_appWith(FakeCategoryRepository(const [])));
    await tester.pumpAndSettle();

    await tester.tap(find.text('내 정보'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('오답노트'));
    await tester.pumpAndSettle();
    expect(find.text('아직 저장된 오답노트가 없습니다.'), findsOneWidget);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.text('아직 저장된 오답노트가 없습니다.'), findsNothing);
    expect(find.text('내 정보'), findsWidgets);
  });
}
