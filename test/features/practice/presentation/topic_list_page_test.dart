import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/domain/category_repository.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/features/practice/domain/practice_mode.dart';
import 'package:my_app/features/practice/domain/question.dart';
import 'package:my_app/features/practice/domain/question_repository.dart';
import 'package:my_app/features/practice/presentation/practice_providers.dart';
import 'package:my_app/features/practice/presentation/topic_list_page.dart';

class _FakeCategoryRepository implements CategoryRepository {
  const _FakeCategoryRepository(this._categories);

  final List<Category> _categories;

  @override
  Future<List<Category>> fetchTopLevelCategories() async => _categories;

  @override
  Future<List<Category>> fetchChildCategories(String parentId) async {
    return _categories.where((category) => category.parentId == parentId).toList();
  }

  @override
  Future<Category> fetchCategoryBySlug(String slug) async {
    return _categories.firstWhere((category) => category.slug == slug);
  }
}

class _FakeQuestionRepository implements QuestionRepository {
  const _FakeQuestionRepository(this._questions);

  final List<Question> _questions;

  @override
  Future<List<Question>> fetchQuestionsByCategory(String categoryId) async {
    return _questions.where((q) => q.categoryId == categoryId).toList();
  }

  @override
  Future<Question> fetchQuestionById(String id) async {
    return _questions.firstWhere((q) => q.id == id);
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

const _dataStructures = Category(
  id: 't1',
  parentId: 'c1',
  slug: 'cs-data-structures',
  name: '자료구조',
  description: null,
  sortOrder: 1,
);

const _os = Category(
  id: 't2',
  parentId: 'c1',
  slug: 'cs-os',
  name: '운영체제',
  description: null,
  sortOrder: 2,
);

Widget _appWith(
  CategoryRepository repository, {
  PracticeMode mode = PracticeMode.study,
  QuestionRepository? questionRepository,
}) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => TopicListPage(fieldSlug: 'cs', mode: mode),
      ),
      GoRoute(
        path: '/categories/cs/study/cs-data-structures',
        builder: (context, state) => const Scaffold(body: Text('TOPIC_PAGE')),
      ),
      GoRoute(
        path: '/categories/cs/practice/:topic/:questionId',
        builder: (context, state) {
          final topic = state.pathParameters['topic'];
          final questionId = state.pathParameters['questionId'];
          return Scaffold(body: Text('QUESTION:$topic:$questionId'));
        },
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      categoryRepositoryProvider.overrideWithValue(repository),
      if (questionRepository != null)
        questionRepositoryProvider.overrideWithValue(questionRepository),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  testWidgets('주제 카드를 누르면 문제 목록 라우트로 이동한다', (tester) async {
    await tester.pumpWidget(_appWith(const _FakeCategoryRepository([_cs, _dataStructures])));
    await tester.pumpAndSettle();

    await tester.tap(find.text('자료구조'));
    await tester.pumpAndSettle();

    expect(find.text('TOPIC_PAGE'), findsOneWidget);
  });

  testWidgets('문제풀기 모드에서는 전체 랜덤 카드가 맨 앞에 보인다', (tester) async {
    await tester.pumpWidget(
      _appWith(
        const _FakeCategoryRepository([_cs, _dataStructures, _os]),
        mode: PracticeMode.practice,
        questionRepository: const _FakeQuestionRepository([]),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('전체 랜덤'), findsOneWidget);
    expect(find.text('자료구조'), findsOneWidget);
    expect(find.text('운영체제'), findsOneWidget);
  });

  testWidgets('전체 랜덤 카드를 누르면 분야의 문제 중 하나로 바로 이동한다', (tester) async {
    const question = Question(
      id: 'q1',
      categoryId: 't1',
      type: 'descriptive',
      prompt: '배열과 연결 리스트의 차이를 설명하라.',
      modelAnswer: null,
      difficulty: 'easy',
      tags: [],
    );
    await tester.pumpWidget(
      _appWith(
        const _FakeCategoryRepository([_cs, _dataStructures, _os]),
        mode: PracticeMode.practice,
        questionRepository: const _FakeQuestionRepository([question]),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('전체 랜덤'));
    await tester.pumpAndSettle();

    expect(find.text('QUESTION:cs-data-structures:q1'), findsOneWidget);
  });

  testWidgets('학습하기 모드에서는 전체 랜덤 카드가 보이지 않는다', (tester) async {
    await tester.pumpWidget(_appWith(const _FakeCategoryRepository([_cs, _dataStructures])));
    await tester.pumpAndSettle();

    expect(find.text('전체 랜덤'), findsNothing);
  });

  testWidgets('주제가 없으면 빈 상태 문구를 보여준다', (tester) async {
    await tester.pumpWidget(_appWith(const _FakeCategoryRepository([_cs])));
    await tester.pumpAndSettle();

    expect(find.text('아직 등록된 주제가 없습니다.'), findsOneWidget);
  });
}
