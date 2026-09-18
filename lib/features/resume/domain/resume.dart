enum ResumeSourceType {
  paste,
  pdf;

  static ResumeSourceType fromValue(String value) {
    return ResumeSourceType.values.firstWhere((type) => type.name == value);
  }
}

/// 이력서. 기기에 1개만 보관하며 저장할 때마다 덮어쓴다.
class Resume {
  const Resume({required this.sourceType, required this.text, required this.updatedAt});

  final ResumeSourceType sourceType;
  final String text;
  final DateTime updatedAt;

  factory Resume.fromJson(Map<String, dynamic> json) {
    return Resume(
      sourceType: ResumeSourceType.fromValue(json['source_type'] as String),
      text: json['text'] as String,
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'source_type': sourceType.name,
      'text': text,
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
