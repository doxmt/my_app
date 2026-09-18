/// 문제 모델 (서술형).
class Question {
  const Question({
    required this.id,
    required this.categoryId,
    required this.type,
    required this.prompt,
    required this.modelAnswer,
    required this.difficulty,
    required this.tags,
  });

  final String id;
  final String categoryId;
  final String type;
  final String prompt;
  final String? modelAnswer;
  final String? difficulty;
  final List<String> tags;

  factory Question.fromJson(Map<String, dynamic> json) {
    return Question(
      id: json['id'] as String,
      categoryId: json['category_id'] as String,
      type: json['type'] as String,
      prompt: json['prompt'] as String,
      modelAnswer: json['model_answer'] as String?,
      difficulty: json['difficulty'] as String?,
      tags: (json['tags'] as List<dynamic>? ?? const []).cast<String>(),
    );
  }
}
