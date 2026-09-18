import 'question.dart';

/// 문제 조회 리포지토리 인터페이스.
abstract class QuestionRepository {
  /// 주제(카테고리)에 속한 문제를 가져온다.
  Future<List<Question>> fetchQuestionsByCategory(String categoryId);

  /// id로 문제 하나를 가져온다.
  Future<Question> fetchQuestionById(String id);
}
