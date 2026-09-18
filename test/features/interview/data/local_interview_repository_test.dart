import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/storage/local_json_store.dart';
import 'package:my_app/features/interview/data/local_interview_repository.dart';
import 'package:my_app/features/interview/domain/interview_message.dart';
import 'package:my_app/features/interview/domain/interview_session.dart';

class FakeLocalJsonStore implements LocalJsonStore {
  final Map<String, Map<String, dynamic>> _data = {};

  @override
  Future<Map<String, dynamic>?> read(String key) async => _data[key];

  @override
  Future<void> write(String key, Map<String, dynamic> value) async {
    _data[key] = value;
  }
}

InterviewSession _session({List<InterviewMessage> messages = const []}) {
  return InterviewSession(
    categorySlug: 'cs',
    categoryName: 'CS',
    jobTitle: '백엔드 개발자',
    messages: messages,
  );
}

void main() {
  test('저장하기 전에는 fetch가 null을 돌려준다', () async {
    final repository = LocalInterviewRepository(FakeLocalJsonStore());

    final session = await repository.fetch();

    expect(session, isNull);
  });

  test('저장한 세션이 fetch에 나타난다', () async {
    final repository = LocalInterviewRepository(FakeLocalJsonStore());

    await repository.save(_session());
    final session = await repository.fetch();

    expect(session?.categorySlug, 'cs');
  });

  test('clear 후에는 fetch가 다시 null을 돌려준다', () async {
    final repository = LocalInterviewRepository(FakeLocalJsonStore());
    await repository.save(_session());

    await repository.clear();
    final session = await repository.fetch();

    expect(session, isNull);
  });

  test('메시지를 포함한 세션을 저장하고 다시 읽으면 메시지가 유지된다', () async {
    final repository = LocalInterviewRepository(FakeLocalJsonStore());
    final message = InterviewMessage(
      role: MessageRole.user,
      content: '안녕하세요',
      createdAt: DateTime.utc(2026, 9, 18),
    );

    await repository.save(_session(messages: [message]));
    final session = await repository.fetch();

    expect(session?.messages, hasLength(1));
    expect(session?.messages.single.content, '안녕하세요');
  });
}
