import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/interview/domain/interview_chat_client.dart';
import 'package:my_app/features/interview/domain/interview_message.dart';
import 'package:my_app/features/interview/domain/interview_repository.dart';
import 'package:my_app/features/interview/domain/interview_session.dart';
import 'package:my_app/features/interview/presentation/interview_page.dart';
import 'package:my_app/features/interview/presentation/interview_providers.dart';
import 'package:my_app/features/resume/domain/resume.dart';
import 'package:my_app/features/resume/domain/resume_repository.dart';
import 'package:my_app/features/resume/presentation/resume_providers.dart';

class FakeResumeRepository implements ResumeRepository {
  @override
  Future<Resume?> fetch() async {
    return Resume(
      sourceType: ResumeSourceType.paste,
      text: '3년차 백엔드 개발자',
      updatedAt: DateTime.utc(2026, 9, 18),
    );
  }

  @override
  Future<void> save(Resume resume) async {}
}

class FakeInterviewRepository implements InterviewRepository {
  FakeInterviewRepository(this._session);

  InterviewSession? _session;

  @override
  Future<InterviewSession?> fetch() async => _session;

  @override
  Future<void> save(InterviewSession session) async {
    _session = session;
  }

  @override
  Future<void> clear() async {
    _session = null;
  }
}

/// 실제 네트워크 없이 토막 문자열을 순차 emit하는 스텁.
class StubInterviewChatClient implements InterviewChatClient {
  final controller = StreamController<String>();

  @override
  Future<UsageStatus> fetchUsage() async {
    return const UsageStatus(deviceRemaining: 9, ipRemaining: 39);
  }

  @override
  Stream<String> streamReply({
    required String categoryName,
    required String jobTitle,
    required String resumeText,
    required List<InterviewMessage> history,
    required String message,
    void Function(int deviceRemaining, int ipRemaining)? onUsage,
  }) {
    onUsage?.call(8, 38);
    return controller.stream;
  }
}

Widget _pageWith({
  required InterviewRepository interviewRepository,
  required InterviewChatClient chatClient,
}) {
  return ProviderScope(
    overrides: [
      resumeRepositoryProvider.overrideWithValue(FakeResumeRepository()),
      interviewRepositoryProvider.overrideWithValue(interviewRepository),
      interviewChatClientProvider.overrideWithValue(chatClient),
    ],
    child: const MaterialApp(home: InterviewPage()),
  );
}

void main() {
  testWidgets('스트리밍 응답이 도착하는 대로 말풍선에 누적된다', (tester) async {
    final session = const InterviewSession(
      categorySlug: 'cs',
      categoryName: 'CS',
      jobTitle: '백엔드 개발자',
      messages: [],
    );
    final chatClient = StubInterviewChatClient();

    await tester.pumpWidget(
      _pageWith(
        interviewRepository: FakeInterviewRepository(session),
        chatClient: chatClient,
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '질문 있어요');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pump();
    await tester.pump();

    expect(find.text('질문 있어요'), findsOneWidget);

    chatClient.controller.add('안녕');
    await tester.pump();
    expect(find.text('안녕'), findsOneWidget);

    chatClient.controller.add('하세요');
    await tester.pump();
    expect(find.text('안녕하세요'), findsOneWidget);

    await chatClient.controller.close();
    await tester.pumpAndSettle();

    expect(find.text('안녕하세요'), findsOneWidget);
  });
}
