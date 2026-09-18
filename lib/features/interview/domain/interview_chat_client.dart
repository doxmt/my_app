import 'interview_message.dart';

class UsageStatus {
  const UsageStatus({required this.deviceRemaining, required this.ipRemaining});

  final int deviceRemaining;
  final int ipRemaining;
}

/// `interview-chat` Edge Function 호출 클라이언트 인터페이스.
/// 벤더 SDK를 직접 쓰지 않고, 텍스트 조각 [Stream]으로 정규화된 응답만 다룬다.
abstract class InterviewChatClient {
  /// 카운트를 증가시키지 않는 읽기 전용 사용량 조회. 배너 초기값용.
  Future<UsageStatus> fetchUsage();

  Stream<String> streamReply({
    required String categoryName,
    required String jobTitle,
    required String resumeText,
    required List<InterviewMessage> history,
    required String message,
    void Function(int deviceRemaining, int ipRemaining)? onUsage,
  });
}

sealed class InterviewChatException implements Exception {
  const InterviewChatException(this.message);

  final String message;
}

class InterviewRateLimitedException extends InterviewChatException {
  const InterviewRateLimitedException({
    required this.blockedBy,
    required this.deviceRemaining,
    required this.ipRemaining,
  }) : super(
         blockedBy == 'device'
             ? '오늘 이 기기에서 사용할 수 있는 면접 횟수를 모두 사용했습니다.'
             : '현재 네트워크에서 사용할 수 있는 면접 횟수를 모두 사용했습니다.',
       );

  final String? blockedBy;
  final int deviceRemaining;
  final int ipRemaining;
}

class InterviewUpstreamException extends InterviewChatException {
  const InterviewUpstreamException() : super('면접 답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
}

class InterviewNetworkException extends InterviewChatException {
  const InterviewNetworkException() : super('네트워크 연결을 확인해주세요.');
}
