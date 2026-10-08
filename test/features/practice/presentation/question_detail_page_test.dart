import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/features/practice/domain/practice_mode.dart';
import 'package:my_app/features/practice/domain/question.dart';
import 'package:my_app/features/practice/domain/random_pick.dart';
import 'package:my_app/features/practice/presentation/practice_providers.dart';
import 'package:my_app/features/practice/presentation/question_detail_page.dart';

const _field = Category(id: 'c1', parentId: null, slug: 'cs', name: 'CS', description: null, sortOrder: 1);

const _ds = Category(
  id: 't1',
  parentId: 'c1',
  slug: 'data-structures',
  name: '자료구조',
  description: null,
  sortOrder: 1,
);

const _os = Category(id: 't2', parentId: 'c1', slug: 'os', name: '운영체제', description: null, sortOrder: 2);

Question _question(String id, String categoryId) => Question(
  id: id,
  categoryId: categoryId,
  type: 'essay',
  prompt: '문제 $id',
  modelAnswer: '답 $id',
  difficulty: null,
  tags: const [],
);

Widget _app({RandomScope? scope, List<Question> dsQuestions = const [], List<Question> osQuestions = const []}) {
  final query = scope == null ? '' : '?random=${scope.queryValue}';
  final router = GoRouter(
    initialLocation: '/categories/cs/study/data-structures/q1$query',
    routes: [
      GoRoute(
        path: '/categories/cs/study/:topic/:questionId',
        builder: (context, state) => QuestionDetailPage(
          fieldSlug: 'cs',
          mode: PracticeMode.study,
          topicSlug: state.pathParameters['topic']!,
          questionId: state.pathParameters['questionId']!,
          randomScope: RandomScope.fromQueryValue(state.uri.queryParameters['random']),
        ),
      ),
    ],
  );
  return ProviderScope(
    overrides: [
      categoryBySlugProvider('cs').overrideWith((ref) async => _field),
      categoryBySlugProvider('data-structures').overrideWith((ref) async => _ds),
      categoryBySlugProvider('os').overrideWith((ref) async => _os),
      childCategoriesProvider('c1').overrideWith((ref) async => [_ds, _os]),
      questionsByCategoryProvider('t1').overrideWith((ref) async => dsQuestions),
      questionsByCategoryProvider('t2').overrideWith((ref) async => osQuestions),
    ],
    child: MaterialApp.router(routerConfig: router),
  );
}

void main() {
  testWidgets('random 쿼리가 없으면 다음 랜덤 문제 버튼이 보이지 않는다', (tester) async {
    await tester.pumpWidget(_app(dsQuestions: [_question('q1', 't1'), _question('q2', 't1')]));
    await tester.pumpAndSettle();

    expect(find.text('다음 랜덤 문제'), findsNothing);
  });

  testWidgets('랜덤 학습에서는 이전/다음 버튼을 숨기고 일반 학습에서는 보여준다', (tester) async {
    final questions = [_question('q1', 't1'), _question('q2', 't1')];

    await tester.pumpWidget(_app(scope: RandomScope.topic, dsQuestions: questions, osQuestions: [_question('q3', 't2')]));
    await tester.pumpAndSettle();
    expect(find.text('이전'), findsNothing);
    expect(find.text('다음'), findsNothing);
    expect(find.text('다음 랜덤 문제'), findsOneWidget);

    await tester.pumpWidget(_app(dsQuestions: questions));
    await tester.pumpAndSettle();
    expect(find.text('이전'), findsOneWidget);
    expect(find.text('다음'), findsOneWidget);
  });

  testWidgets('random=topic이면 버튼이 보이고 같은 주제의 다른 문제로 이동한다', (tester) async {
    await tester.pumpWidget(
      _app(
        scope: RandomScope.topic,
        dsQuestions: [_question('q1', 't1'), _question('q2', 't1')],
        osQuestions: [_question('q3', 't2')],
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('다음 랜덤 문제'));
    await tester.pumpAndSettle();

    expect(find.text('문제 q2'), findsOneWidget);
  });

  testWidgets('random=topic이고 주제에 문제가 하나뿐이면 버튼을 숨긴다', (tester) async {
    await tester.pumpWidget(_app(scope: RandomScope.topic, dsQuestions: [_question('q1', 't1')]));
    await tester.pumpAndSettle();

    expect(find.text('다음 랜덤 문제'), findsNothing);
  });

  testWidgets('random=field이면 분야 전체에서 현재 문제가 아닌 문제로 이동한다', (tester) async {
    await tester.pumpWidget(
      _app(scope: RandomScope.field, dsQuestions: [_question('q1', 't1')], osQuestions: [_question('q3', 't2')]),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('다음 랜덤 문제'));
    await tester.pumpAndSettle();

    expect(find.text('문제 q3'), findsOneWidget);
  });
}
