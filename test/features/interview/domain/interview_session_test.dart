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
      categorySlug: 'cs',
      categoryName: 'CS',
      jobTitle: '백엔드 개발자',
      messages: [
        InterviewMessage(
          role: MessageRole.user,
          content: '안녕하세요',
          createdAt: DateTime.utc(2026, 9, 18),
        ),
      ],
    );

    final roundTripped = InterviewSession.fromJson(session.toJson());

    expect(roundTripped.categorySlug, 'cs');
    expect(roundTripped.categoryName, 'CS');
    expect(roundTripped.jobTitle, '백엔드 개발자');
    expect(roundTripped.messages, hasLength(1));
    expect(roundTripped.messages.single.content, '안녕하세요');
  });

  test('copyWithMessages는 다른 필드를 유지한 채 메시지만 바꾼다', () {
    const session = InterviewSession(
      categorySlug: 'cs',
      categoryName: 'CS',
      jobTitle: '백엔드 개발자',
      messages: [],
    );

    final updated = session.copyWithMessages([
      InterviewMessage(role: MessageRole.user, content: 'hi', createdAt: DateTime.utc(2026, 9, 18)),
    ]);

    expect(updated.categorySlug, session.categorySlug);
    expect(updated.messages, hasLength(1));
  });
}
