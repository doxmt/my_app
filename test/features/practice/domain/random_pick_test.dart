import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/practice/domain/question.dart';
import 'package:my_app/features/practice/domain/random_pick.dart';

/// 항상 [value]를 돌려주는 결정적 Random.
class _FixedRandom implements Random {
  _FixedRandom(this.value);

  final int value;

  @override
  int nextInt(int max) => value % max;

  @override
  bool nextBool() => false;

  @override
  double nextDouble() => 0;
}

Question _question(String id) => Question(
  id: id,
  categoryId: 't1',
  type: 'essay',
  prompt: id,
  modelAnswer: null,
  difficulty: null,
  tags: const [],
);

void main() {
  const pool = [
    (topicSlug: 'a', questionId: 'q1'),
    (topicSlug: 'a', questionId: 'q2'),
    (topicSlug: 'b', questionId: 'q3'),
  ];

  group('randomEntriesOfTopic', () {
    test('문제마다 주제 슬러그를 붙인 항목을 만든다', () {
      expect(randomEntriesOfTopic('a', [_question('q1'), _question('q2')]), [
        (topicSlug: 'a', questionId: 'q1'),
        (topicSlug: 'a', questionId: 'q2'),
      ]);
    });
  });

  group('pickRandomEntry', () {
    test('Random이 가리키는 항목을 고른다', () {
      expect(pickRandomEntry(pool, _FixedRandom(2))?.questionId, 'q3');
    });

    test('현재 문제는 후보에서 제외한다', () {
      for (var i = 0; i < 6; i++) {
        final pick = pickRandomEntry(pool, _FixedRandom(i), excludeQuestionId: 'q2');
        expect(pick?.questionId, isNot('q2'));
      }
      expect(pickRandomEntry(pool, _FixedRandom(1), excludeQuestionId: 'q2')?.questionId, 'q3');
    });

    test('풀이 비어 있으면 null이다', () {
      expect(pickRandomEntry(const [], _FixedRandom(0)), isNull);
    });

    test('풀에 현재 문제 하나뿐이면 null이다', () {
      expect(
        pickRandomEntry(const [(topicSlug: 'a', questionId: 'q1')], _FixedRandom(0), excludeQuestionId: 'q1'),
        isNull,
      );
    });

    test('제외하지 않으면 문제 하나뿐인 풀에서도 그 문제를 고른다', () {
      expect(pickRandomEntry(const [(topicSlug: 'a', questionId: 'q1')], _FixedRandom(0))?.questionId, 'q1');
    });
  });

  group('RandomScope', () {
    test('쿼리 값을 해석하고 모르는 값은 null이다', () {
      expect(RandomScope.fromQueryValue('field'), RandomScope.field);
      expect(RandomScope.fromQueryValue('topic'), RandomScope.topic);
      expect(RandomScope.fromQueryValue('x'), isNull);
      expect(RandomScope.fromQueryValue(null), isNull);
    });
  });
}
