import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/consent/openai_consent_provider.dart';
import 'package:my_app/core/legal/legal_links.dart';
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
  FakeResumeRepository({this.selfIntroduction = ''});

  final String selfIntroduction;

  @override
  Future<Resume?> fetch() async {
    return Resume(
      sourceType: ResumeSourceType.paste,
      text: '3년차 백엔드 개발자',
      updatedAt: DateTime.utc(2026, 9, 18),
      selfIntroduction: selfIntroduction,
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

  /// streamReply 호출 횟수와 마지막 사용자 메시지. 자동 호출 여부를 확인하는 용도.
  int callCount = 0;
  String? lastMessage;

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
    callCount++;
    lastMessage = message;
    onUsage?.call(const GuestUsageStatus(deviceRemaining: 8, ipRemaining: 38));
    return controller.stream;
  }
}

class FakeOpenAiConsentStore implements OpenAiConsentStore {
  FakeOpenAiConsentStore({this.consented = false});

  bool consented;

  @override
  Future<bool> read() async => consented;

  @override
  Future<void> write() async {
    consented = true;
  }
}

Widget _pageWith({
  required InterviewRepository interviewRepository,
  required InterviewChatClient chatClient,
  String selfIntroduction = '',
  OpenAiConsentStore? consentStore,
}) {
  return ProviderScope(
    overrides: [
      resumeRepositoryProvider.overrideWithValue(FakeResumeRepository(selfIntroduction: selfIntroduction)),
      interviewRepositoryProvider.overrideWithValue(interviewRepository),
      interviewChatClientProvider.overrideWithValue(chatClient),
      openAiConsentStoreProvider.overrideWithValue(consentStore ?? FakeOpenAiConsentStore(consented: true)),
      legalUrlsProvider.overrideWithValue(LegalUrls.fromOrigin('https://example.com')),
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

  testWidgets('자기소개로 시작하기를 켜면 저장된 자기소개로 미리 채워진다', (tester) async {
    await tester.pumpWidget(
      _pageWith(
        interviewRepository: FakeInterviewRepository(null),
        chatClient: StubInterviewChatClient(),
        selfIntroduction: '안녕하세요, 백엔드 개발자입니다.',
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('안녕하세요, 백엔드 개발자입니다.'), findsNothing);

    await tester.tap(find.text('자기소개로 시작하기'));
    await tester.pumpAndSettle();

    expect(find.text('안녕하세요, 백엔드 개발자입니다.'), findsOneWidget);
  });

  testWidgets('자기소개로 시작하기를 켠 채 내용이 비어 있으면 시작되지 않는다', (tester) async {
    final repository = FakeInterviewRepository(null);
    final chatClient = StubInterviewChatClient();

    await tester.pumpWidget(_pageWith(interviewRepository: repository, chatClient: chatClient));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), '백엔드 개발자');
    await tester.tap(find.text('자기소개로 시작하기'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('면접 시작'));
    await tester.tap(find.text('면접 시작'));
    await tester.pumpAndSettle();

    expect(find.text('자기소개를 입력해 주세요.'), findsOneWidget);
    expect(await repository.fetch(), isNull);
    expect(chatClient.callCount, 0);
  });

  testWidgets('자기소개로 시작하면 자기소개가 첫 메시지로 전송되고 한 번만 호출된다', (tester) async {
    final repository = FakeInterviewRepository(null);
    final chatClient = StubInterviewChatClient();

    await tester.pumpWidget(
      _pageWith(interviewRepository: repository, chatClient: chatClient, selfIntroduction: '저장된 자기소개'),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).at(0), '백엔드 개발자');
    await tester.tap(find.text('자기소개로 시작하기'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('면접 시작'));
    await tester.tap(find.text('면접 시작'));
    await tester.pump();
    await tester.pump();
    await tester.pump();

    expect(chatClient.callCount, 1);
    expect(chatClient.lastMessage, '저장된 자기소개');
    expect(find.text('저장된 자기소개'), findsOneWidget);

    chatClient.controller.add('1분 정도 더 설명해 주세요.');
    await chatClient.controller.close();
    await tester.pumpAndSettle();

    expect(find.text('1분 정도 더 설명해 주세요.'), findsOneWidget);
    final session = await repository.fetch();
    expect(session?.messages.map((m) => m.role), [MessageRole.user, MessageRole.assistant]);
    expect(chatClient.callCount, 1);
  });

  testWidgets('마지막 메시지가 사용자 메시지인 저장된 세션을 다시 열어도 자동으로 호출하지 않는다', (tester) async {
    final session = InterviewSession(
      jobTitle: '백엔드 개발자',
      messages: [InterviewMessage(role: MessageRole.user, content: '자기소개입니다', createdAt: DateTime.utc(2026, 9, 18))],
    );
    final chatClient = StubInterviewChatClient();

    await tester.pumpWidget(_pageWith(interviewRepository: FakeInterviewRepository(session), chatClient: chatClient));
    await tester.pumpAndSettle();

    expect(find.text('자기소개입니다'), findsOneWidget);
    expect(chatClient.callCount, 0);
  });

  group('OpenAI 전송 동의', () {
    Future<void> enterJobAndStart(WidgetTester tester) async {
      await tester.enterText(find.byType(TextField).first, '백엔드 개발자');
      await tester.ensureVisible(find.text('면접 시작'));
      await tester.tap(find.text('면접 시작'));
      await tester.pumpAndSettle();
    }

    testWidgets('동의 전에는 면접이 시작되지 않고 동의 화면이 뜬다', (tester) async {
      final repository = FakeInterviewRepository(null);
      final store = FakeOpenAiConsentStore();
      await tester.pumpWidget(
        _pageWith(
          interviewRepository: repository,
          chatClient: StubInterviewChatClient(),
          consentStore: store,
        ),
      );
      await tester.pumpAndSettle();

      await enterJobAndStart(tester);

      expect(find.textContaining('OpenAI(미국)'), findsOneWidget);
      expect(await repository.fetch(), isNull);
      expect(store.consented, isFalse);
    });

    testWidgets('동의 화면에서 취소하면 시작되지 않는다', (tester) async {
      final repository = FakeInterviewRepository(null);
      await tester.pumpWidget(
        _pageWith(
          interviewRepository: repository,
          chatClient: StubInterviewChatClient(),
          consentStore: FakeOpenAiConsentStore(),
        ),
      );
      await tester.pumpAndSettle();

      await enterJobAndStart(tester);
      await tester.tap(find.text('동의하지 않음'));
      await tester.pumpAndSettle();

      expect(await repository.fetch(), isNull);
      expect(find.text('면접 시작'), findsOneWidget);
    });

    testWidgets('동의하고 시작하면 저장되고 면접이 시작된다', (tester) async {
      final repository = FakeInterviewRepository(null);
      final store = FakeOpenAiConsentStore();
      await tester.pumpWidget(
        _pageWith(
          interviewRepository: repository,
          chatClient: StubInterviewChatClient(),
          consentStore: store,
        ),
      );
      await tester.pumpAndSettle();

      await enterJobAndStart(tester);
      await tester.tap(find.text('동의하고 시작'));
      await tester.pumpAndSettle();

      expect(store.consented, isTrue);
      expect((await repository.fetch())?.jobTitle, '백엔드 개발자');
    });

    testWidgets('이미 동의한 기기는 다시 묻지 않는다', (tester) async {
      final repository = FakeInterviewRepository(null);
      await tester.pumpWidget(
        _pageWith(
          interviewRepository: repository,
          chatClient: StubInterviewChatClient(),
          consentStore: FakeOpenAiConsentStore(consented: true),
        ),
      );
      await tester.pumpAndSettle();

      await enterJobAndStart(tester);

      expect(find.textContaining('OpenAI(미국)'), findsNothing);
      expect((await repository.fetch())?.jobTitle, '백엔드 개발자');
    });
  });
}
