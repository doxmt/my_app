import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/domain/category_repository.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/features/practice/presentation/field_page.dart';

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

Widget _appWith(CategoryRepository repository) {
  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/', builder: (context, state) => const FieldPage(fieldSlug: 'cs')),
      GoRoute(
        path: '/categories/cs/study',
        builder: (context, state) => const Scaffold(body: Text('STUDY_PAGE')),
      ),
      GoRoute(
        path: '/categories/cs/practice',
        builder: (context, state) => const Scaffold(body: Text('PRACTICE_PAGE')),
      ),
    ],
  );

  return ProviderScope(
    overrides: [categoryRepositoryProvider.overrideWithValue(repository)],
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  testWidgets('학습하기 카드를 누르면 학습하기 라우트로 이동한다', (tester) async {
    await tester.pumpWidget(_appWith(const _FakeCategoryRepository([_cs])));
    await tester.pumpAndSettle();

    await tester.tap(find.text('학습하기'));
    await tester.pumpAndSettle();

    expect(find.text('STUDY_PAGE'), findsOneWidget);
  });

  testWidgets('문제풀기 카드를 누르면 문제풀기 라우트로 이동한다', (tester) async {
    await tester.pumpWidget(_appWith(const _FakeCategoryRepository([_cs])));
    await tester.pumpAndSettle();

    await tester.tap(find.text('문제풀기'));
    await tester.pumpAndSettle();

    expect(find.text('PRACTICE_PAGE'), findsOneWidget);
  });
}
