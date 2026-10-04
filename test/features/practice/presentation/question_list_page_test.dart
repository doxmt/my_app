import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/categories/domain/category.dart';
import 'package:my_app/features/categories/presentation/categories_providers.dart';
import 'package:my_app/features/practice/domain/practice_mode.dart';
import 'package:my_app/features/practice/domain/question.dart';
import 'package:my_app/features/practice/presentation/practice_providers.dart';
import 'package:my_app/features/practice/presentation/question_list_page.dart';

const _topic = Category(
  id: 't1',
  parentId: 'c1',
  slug: 'data-structures',
  name: '자료구조',
  description: null,
  sortOrder: 1,
);

Question _question(String id, String prompt, String? difficulty) => Question(
  id: id,
  categoryId: 't1',
  type: 'essay',
  prompt: prompt,
  modelAnswer: null,
  difficulty: difficulty,
  tags: const [],
);

Widget _app(List<Question> questions) {
  return ProviderScope(
    overrides: [
      categoryBySlugProvider('data-structures').overrideWith((ref) async => _topic),
      questionsByCategoryProvider('t1').overrideWith((ref) async => questions),
    ],
    child: const MaterialApp(
      home: QuestionListPage(fieldSlug: 'cs', mode: PracticeMode.study, topicSlug: 'data-structures'),
    ),
  );
}

void main() {
  testWidgets('학습하기 목록을 난이도로 걸러 볼 수 있다', (tester) async {
    await tester.pumpWidget(
      _app([
        _question('q1', '쉬운 문제', 'easy'),
        _question('q2', '어려운 문제', 'hard'),
        _question('q3', '난이도 없는 문제', null),
      ]),
    );
    await tester.pumpAndSettle();

    expect(find.text('쉬운 문제'), findsOneWidget);
    expect(find.text('어려운 문제'), findsOneWidget);
    expect(find.text('난이도 없는 문제'), findsOneWidget);

    await tester.tap(find.widgetWithText(ChoiceChip, '어려움'));
    await tester.pumpAndSettle();

    expect(find.text('쉬운 문제'), findsNothing);
    expect(find.text('어려운 문제'), findsOneWidget);
    expect(find.text('난이도 없는 문제'), findsNothing);

    await tester.tap(find.widgetWithText(ChoiceChip, '전체'));
    await tester.pumpAndSettle();

    expect(find.text('쉬운 문제'), findsOneWidget);
  });

  testWidgets('고른 난이도의 문제가 없으면 안내 문구를 보여준다', (tester) async {
    await tester.pumpWidget(_app([_question('q1', '쉬운 문제', 'easy')]));
    await tester.pumpAndSettle();

    await tester.tap(find.widgetWithText(ChoiceChip, '보통'));
    await tester.pumpAndSettle();

    expect(find.text('이 난이도의 문제가 없습니다.'), findsOneWidget);
  });
}
