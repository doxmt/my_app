import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/interview/domain/interview_message.dart';
import 'package:my_app/features/interview/domain/interview_session.dart';

void main() {
  test('InterviewMessage toJson/fromJson을 왕복해도 값이 유지된다', () {
    final message = InterviewMessage(
      role: MessageRole.assistant,
      content: '자기소개를 해주세요.',
      createdAt: DateTime.utc(2026, 9, 18, 10),
    );

    final roundTripped = InterviewMessage.fromJson(message.toJson());

    expect(roundTripped.role, message.role);
    expect(roundTripped.content, message.content);
    expect(roundTripped.createdAt, message.createdAt);
  });

  test('InterviewSession toJson/fromJson을 왕복해도 메시지 목록이 유지된다', () {
    final session = InterviewSession(
      jobTitle: '백엔드 개발자',
      jobPosting: 'Kotlin, Spring 우대',
      messages: [
        InterviewMessage(
          role: MessageRole.user,
          content: '안녕하세요',
          createdAt: DateTime.utc(2026, 9, 18),
        ),
      ],
    );

    final roundTripped = InterviewSession.fromJson(session.toJson());

    expect(roundTripped.jobTitle, '백엔드 개발자');
    expect(roundTripped.jobPosting, 'Kotlin, Spring 우대');
    expect(roundTripped.messages, hasLength(1));
    expect(roundTripped.messages.single.content, '안녕하세요');
  });

  test('copyWithMessages는 다른 필드를 유지한 채 메시지만 바꾼다', () {
    const session = InterviewSession(
      jobTitle: '백엔드 개발자',
      jobPosting: 'Kotlin, Spring 우대',
      messages: [],
    );

    final updated = session.copyWithMessages([
      InterviewMessage(
        role: MessageRole.user,
        content: 'hi',
        createdAt: DateTime.utc(2026, 9, 18),
      ),
    ]);

    expect(updated.jobTitle, session.jobTitle);
    expect(updated.jobPosting, session.jobPosting);
    expect(updated.messages, hasLength(1));
  });

  test('채용공고를 입력하지 않으면 빈 문자열이고 JSON에도 job_posting을 쓰지 않는다', () {
    const session = InterviewSession(jobTitle: '백엔드 개발자', messages: []);

    expect(session.jobPosting, '');
    expect(session.toJson().containsKey('job_posting'), isFalse);
  });

  test('분야 값이 들어 있던 예전 저장 형식도 오류 없이 읽는다', () {
    final session = InterviewSession.fromJson({
      'category_slug': 'cs',
      'category_name': 'CS',
      'job_title': '백엔드 개발자',
      'messages': <dynamic>[],
    });

    expect(session.jobTitle, '백엔드 개발자');
    expect(session.jobPosting, '');
    expect(session.toJson().containsKey('category_name'), isFalse);
  });
}
