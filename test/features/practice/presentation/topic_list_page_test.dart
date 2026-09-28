import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/domain/category_repository.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/features/practice/domain/practice_mode.dart';
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

Widget _appWith(CategoryRepository repository) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) =>
            const TopicListPage(fieldSlug: 'cs', mode: PracticeMode.study),
      ),
      GoRoute(
        path: '/categories/cs/study/cs-data-structures',
        builder: (context, state) => const Scaffold(body: Text('TOPIC_PAGE')),
      ),
    ],
  );

  return ProviderScope(
    overrides: [categoryRepositoryProvider.overrideWithValue(repository)],
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

  testWidgets('주제가 없으면 빈 상태 문구를 보여준다', (tester) async {
    await tester.pumpWidget(_appWith(const _FakeCategoryRepository([_cs])));
    await tester.pumpAndSettle();

    expect(find.text('아직 등록된 주제가 없습니다.'), findsOneWidget);
  });
}
