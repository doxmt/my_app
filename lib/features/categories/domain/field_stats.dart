/// 분야(최상위 카테고리) 하나의 주제 수와 게시된 문제 수. 홈 분야 카드에 표시한다.
class FieldStats {
  const FieldStats({required this.topicCount, required this.questionCount});

  final int topicCount;
  final int questionCount;
}

/// 주제 행(`parent_id`, `questions: [{count}]`) 목록을 분야 id별 합계로 묶는다.
Map<String, FieldStats> summarizeFieldStats(List<Map<String, dynamic>> topicRows) {
  final stats = <String, FieldStats>{};
  for (final row in topicRows) {
    final fieldId = row['parent_id'] as String?;
    if (fieldId == null) continue;
    final counts = row['questions'] as List<dynamic>? ?? const [];
    final questions = counts.isEmpty ? 0 : (counts.first as Map<String, dynamic>)['count'] as int? ?? 0;
    final current = stats[fieldId];
    stats[fieldId] = FieldStats(
      topicCount: (current?.topicCount ?? 0) + 1,
      questionCount: (current?.questionCount ?? 0) + questions,
    );
  }
  return stats;
}
