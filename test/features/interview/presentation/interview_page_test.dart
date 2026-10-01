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
  StubInterviewChatClient({UsageStatus? initialUsage})
    : _initialUsage = initialUsage ?? const GuestUsageStatus(deviceRemaining: 9, ipRemaining: 39);

  final controller = StreamController<String>();
  final UsageStatus _initialUsage;

  /// 마지막 요청에 실린 채용공고. 요청에 채용공고가 전달되는지 확인하는 용도.
  String? lastJobPosting;

  @override
  Future<UsageStatus> fetchUsage() async => _initialUsage;

  @override
  Stream<String> streamReply({
    required String jobTitle,
    String jobPosting = '',
    required String resumeText,
    required List<InterviewMessage> history,
    required String message,
    void Function(UsageStatus usage)? onUsage,
  }) {
    lastJobPosting = jobPosting;
    onUsage?.call(const GuestUsageStatus(deviceRemaining: 8, ipRemaining: 38));
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

  testWidgets('회원이면 free 한도 기준 남은 횟수 배너를 보여준다', (tester) async {
    final session = const InterviewSession(
      jobTitle: '백엔드 개발자',
      messages: [],
    );
    final chatClient = StubInterviewChatClient(
      initialUsage: const MemberUsageStatus(remaining: 5),
    );

    await tester.pumpWidget(
      _pageWith(
        interviewRepository: FakeInterviewRepository(session),
        chatClient: chatClient,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('오늘 남은 면접 횟수: 5회'), findsOneWidget);
  });

  testWidgets('새 면접은 분야 선택 없이 직무와 선택 채용공고만 받아 세션을 만든다', (tester) async {
    final repository = FakeInterviewRepository(null);

    await tester.pumpWidget(_pageWith(interviewRepository: repository, chatClient: StubInterviewChatClient()));
    await tester.pumpAndSettle();

    expect(find.byType(ChoiceChip), findsNothing);
    expect(find.text('지원 직무를 입력하세요'), findsOneWidget);
    expect(find.textContaining('채용공고'), findsWidgets);

    // 직무를 비우면 시작되지 않는다.
    await tester.tap(find.text('면접 시작'));
    await tester.pumpAndSettle();
    expect(await repository.fetch(), isNull);

    await tester.enterText(find.byType(TextField).at(0), '백엔드 개발자');
    await tester.enterText(find.byType(TextField).at(1), 'Kotlin, Spring 우대');
    await tester.tap(find.text('면접 시작'));
    await tester.pumpAndSettle();

    final session = await repository.fetch();
    expect(session?.jobTitle, '백엔드 개발자');
    expect(session?.jobPosting, 'Kotlin, Spring 우대');
  });

  testWidgets('채용공고 없이도 직무만으로 면접을 시작할 수 있다', (tester) async {
    final repository = FakeInterviewRepository(null);

    await tester.pumpWidget(_pageWith(interviewRepository: repository, chatClient: StubInterviewChatClient()));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), '프론트엔드 개발자');
    await tester.tap(find.text('면접 시작'));
    await tester.pumpAndSettle();

    final session = await repository.fetch();
    expect(session?.jobTitle, '프론트엔드 개발자');
    expect(session?.jobPosting, '');
  });

  testWidgets('저장된 채용공고가 면접 요청에 실려 간다', (tester) async {
    const session = InterviewSession(jobTitle: '백엔드 개발자', jobPosting: 'Kotlin, Spring 우대', messages: []);
    final chatClient = StubInterviewChatClient();

    await tester.pumpWidget(_pageWith(interviewRepository: FakeInterviewRepository(session), chatClient: chatClient));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '질문 있어요');
    await tester.tap(find.byIcon(Icons.send));
    await tester.pump();
    await tester.pump();

    expect(chatClient.lastJobPosting, 'Kotlin, Spring 우대');

    await chatClient.controller.close();
    await tester.pumpAndSettle();
  });
}
