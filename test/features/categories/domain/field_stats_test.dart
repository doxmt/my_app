import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/categories/domain/field_stats.dart';

void main() {
  test('주제 행을 분야별 주제 수와 문제 수로 묶는다', () {
    final stats = summarizeFieldStats([
      {
        'parent_id': 'f1',
        'questions': [
          {'count': 3},
        ],
      },
      {
        'parent_id': 'f1',
        'questions': [
          {'count': 5},
        ],
      },
      {'parent_id': 'f2', 'questions': <dynamic>[]},
      {'parent_id': null, 'questions': <dynamic>[]},
    ]);

    expect(stats.keys, ['f1', 'f2']);
    expect(stats['f1']!.topicCount, 2);
    expect(stats['f1']!.questionCount, 8);
    expect(stats['f2']!.topicCount, 1);
    expect(stats['f2']!.questionCount, 0);
  });
}
