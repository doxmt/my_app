enum MessageRole {
  user,
  assistant;

  static MessageRole fromValue(String value) {
    return MessageRole.values.firstWhere((role) => role.name == value);
  }
}

class InterviewMessage {
  const InterviewMessage({required this.role, required this.content, required this.createdAt});

  final MessageRole role;
  final String content;
  final DateTime createdAt;

  factory InterviewMessage.fromJson(Map<String, dynamic> json) {
    return InterviewMessage(
      role: MessageRole.fromValue(json['role'] as String),
      content: json['content'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {'role': role.name, 'content': content, 'created_at': createdAt.toIso8601String()};
  }
}
