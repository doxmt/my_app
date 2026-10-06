import 'dart:math';

import 'question.dart';

/// 랜덤으로 고를 수 있는 문제 하나. 상세 라우트를 만들 때 주제 슬러그가 필요해 함께 든다.
typedef RandomEntry = ({String topicSlug, String questionId});

/// 학습하기 상세 "다음 랜덤 문제"의 범위. 라우트 쿼리 `?random=field|topic`로 전달한다.
enum RandomScope {
  field('field'),
  topic('topic');

  const RandomScope(this.queryValue);

  final String queryValue;

  static RandomScope? fromQueryValue(String? value) {
    for (final scope in RandomScope.values) {
      if (scope.queryValue == value) {
        return scope;
      }
    }
    return null;
  }
}

/// 주제 하나의 문제들을 랜덤 풀 항목으로 바꾼다.
List<RandomEntry> randomEntriesOfTopic(String topicSlug, List<Question> questions) {
  return [for (final question in questions) (topicSlug: topicSlug, questionId: question.id)];
}

/// 풀에서 무작위로 하나를 고른다. [excludeQuestionId]는 후보에서 뺀다. 고를 문제가 없으면 null.
RandomEntry? pickRandomEntry(List<RandomEntry> pool, Random random, {String? excludeQuestionId}) {
  final candidates = excludeQuestionId == null
      ? pool
      : pool.where((entry) => entry.questionId != excludeQuestionId).toList();
  if (candidates.isEmpty) return null;
  return candidates[random.nextInt(candidates.length)];
}
