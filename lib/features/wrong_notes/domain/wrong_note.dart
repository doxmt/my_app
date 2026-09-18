/// 오답노트 항목. 문제 텍스트를 스냅샷으로 함께 들고 있어 오프라인에서도 보인다.
class WrongNote {
  const WrongNote({
    required this.questionId,
    required this.categoryId,
    required this.questionPrompt,
    required this.savedAt,
    this.isResolved = false,
    this.resolvedAt,
  });

  final String questionId;
  final String categoryId;
  final String questionPrompt;
  final DateTime savedAt;
  final bool isResolved;
  final DateTime? resolvedAt;

  factory WrongNote.fromJson(Map<String, dynamic> json) {
    return WrongNote(
      questionId: json['question_id'] as String,
      categoryId: json['category_id'] as String,
      questionPrompt: json['question_prompt'] as String,
      savedAt: DateTime.parse(json['saved_at'] as String),
      isResolved: json['is_resolved'] as bool? ?? false,
      resolvedAt: json['resolved_at'] == null
          ? null
          : DateTime.parse(json['resolved_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question_id': questionId,
      'category_id': categoryId,
      'question_prompt': questionPrompt,
      'saved_at': savedAt.toIso8601String(),
      'is_resolved': isResolved,
      'resolved_at': resolvedAt?.toIso8601String(),
    };
  }
}
