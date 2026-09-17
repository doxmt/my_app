import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/domain/category_repository.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/main.dart';

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
    overrides: [categoryRepositoryProvider.overrideWithValue(repository)],
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
    expect(find.text('모의면접 기능은 준비 중입니다.'), findsOneWidget);

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
    expect(find.text('오답노트 기능은 준비 중입니다.'), findsOneWidget);

    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.text('오답노트 기능은 준비 중입니다.'), findsNothing);
    expect(find.text('내 정보'), findsWidgets);
  });
}
