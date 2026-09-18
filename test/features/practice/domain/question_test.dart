import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/practice/domain/question.dart';

void main() {
  test('Question.fromJson이 JSON을 모델로 변환한다', () {
    final question = Question.fromJson({
      'id': 'q1',
      'category_id': 'c11',
      'type': 'descriptive',
      'prompt': '배열과 연결 리스트의 차이를 설명하라.',
      'model_answer': '배열은 연속 메모리, 연결 리스트는 포인터로 연결된다.',
      'difficulty': 'medium',
      'tags': ['자료구조', '배열'],
    });

    expect(question.id, 'q1');
    expect(question.categoryId, 'c11');
    expect(question.type, 'descriptive');
    expect(question.prompt, '배열과 연결 리스트의 차이를 설명하라.');
    expect(question.modelAnswer, '배열은 연속 메모리, 연결 리스트는 포인터로 연결된다.');
    expect(question.difficulty, 'medium');
    expect(question.tags, ['자료구조', '배열']);
  });

  test('model_answer, difficulty, tags가 없어도 안전하게 변환한다', () {
    final question = Question.fromJson({
      'id': 'q2',
      'category_id': 'c11',
      'type': 'descriptive',
      'prompt': '스택과 큐의 차이를 설명하라.',
      'model_answer': null,
      'difficulty': null,
      'tags': null,
    });

    expect(question.modelAnswer, isNull);
    expect(question.difficulty, isNull);
    expect(question.tags, isEmpty);
  });
}
