import 'interview_message.dart';

/// 진행 중인 면접 세션(비회원, 기기 로컬). 기기에 1개만 보관한다.
class InterviewSession {
  const InterviewSession({
    required this.jobTitle,
    this.jobPosting = '',
    required this.messages,
  });

  final String jobTitle;

  /// 선택. 사용자가 붙여넣은 회사 채용공고 텍스트(없으면 빈 문자열).
  final String jobPosting;
  final List<InterviewMessage> messages;

  factory InterviewSession.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['messages'] as List<dynamic>? ?? const [];
    return InterviewSession(
      // 예전 버전에는 category_slug/category_name이 함께 저장돼 있었다. 지금은 쓰지 않아 읽지 않는다.
      jobTitle: json['job_title'] as String,
      jobPosting: json['job_posting'] as String? ?? '',
      messages: rawMessages
          .map((item) => InterviewMessage.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'job_title': jobTitle,
      if (jobPosting.isNotEmpty) 'job_posting': jobPosting,
      'messages': messages.map((message) => message.toJson()).toList(),
    };
  }

  InterviewSession copyWithMessages(List<InterviewMessage> newMessages) {
    return InterviewSession(
      jobTitle: jobTitle,
      jobPosting: jobPosting,
      messages: newMessages,
    );
  }
}
