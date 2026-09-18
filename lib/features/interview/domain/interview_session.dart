import 'interview_message.dart';

/// 진행 중인 면접 세션(비회원, 기기 로컬). 기기에 1개만 보관한다.
class InterviewSession {
  const InterviewSession({
    required this.categorySlug,
    required this.categoryName,
    required this.jobTitle,
    required this.messages,
  });

  final String categorySlug;
  final String categoryName;
  final String jobTitle;
  final List<InterviewMessage> messages;

  factory InterviewSession.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['messages'] as List<dynamic>? ?? const [];
    return InterviewSession(
      categorySlug: json['category_slug'] as String,
      categoryName: json['category_name'] as String,
      jobTitle: json['job_title'] as String,
      messages: rawMessages
          .map((item) => InterviewMessage.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category_slug': categorySlug,
      'category_name': categoryName,
      'job_title': jobTitle,
      'messages': messages.map((message) => message.toJson()).toList(),
    };
  }

  InterviewSession copyWithMessages(List<InterviewMessage> newMessages) {
    return InterviewSession(
      categorySlug: categorySlug,
      categoryName: categoryName,
      jobTitle: jobTitle,
      messages: newMessages,
    );
  }
}
