import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/consent/openai_consent_provider.dart';
import '../../../core/legal/legal_links.dart';
import '../../../core/speech/dictation_button.dart';
import '../../resume/domain/self_intro_extractor.dart';
import '../../resume/presentation/resume_providers.dart';
import '../domain/interview_chat_client.dart';
import '../domain/interview_message.dart';
import '../domain/interview_session.dart';
import 'interview_providers.dart';

/// 모의면접 탭. 이력서가 없으면 입력을 유도하고, 있으면 분야·직무 선택 후 채팅으로 이어진다.
class InterviewPage extends ConsumerWidget {
  const InterviewPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final resumeAsync = ref.watch(resumeProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('모의면접')),
      body: resumeAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('이력서를 불러오지 못했습니다.'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(resumeProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (resume) {
          if (resume == null || resume.text.trim().isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('모의면접을 시작하려면 이력서를 먼저 입력해주세요.'),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () => context.push('/me/resume?from=interview'),
                    child: const Text('이력서 입력하기'),
                  ),
                ],
              ),
            );
          }
          return _InterviewBody(resumeText: resume.text, selfIntroduction: resume.selfIntroduction);
        },
      ),
    );
  }
}

class _InterviewBody extends ConsumerWidget {
  const _InterviewBody({required this.resumeText, required this.selfIntroduction});

  final String resumeText;
  final String selfIntroduction;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionAsync = ref.watch(interviewSessionProvider);

    return sessionAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('면접 세션을 불러오지 못했습니다.'),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => ref.invalidate(interviewSessionProvider),
              child: const Text('다시 시도'),
            ),
          ],
        ),
      ),
      data: (session) {
        if (session == null) {
          return _JobSetupForm(selfIntroduction: selfIntroduction);
        }
        return _ChatView(session: session, resumeText: resumeText);
      },
    );
  }
}

class _JobSetupForm extends ConsumerStatefulWidget {
  const _JobSetupForm({required this.selfIntroduction});

  /// 이력서에 저장된 자기소개. "자기소개로 시작하기"의 입력칸 초기값.
  final String selfIntroduction;

  @override
  ConsumerState<_JobSetupForm> createState() => _JobSetupFormState();
}

class _JobSetupFormState extends ConsumerState<_JobSetupForm> {
  final _jobTitleController = TextEditingController();
  final _jobPostingController = TextEditingController();
  late final TextEditingController _selfIntroController;
  bool _startWithSelfIntro = false;
  bool _showSelfIntroError = false;

  @override
  void initState() {
    super.initState();
    _selfIntroController = TextEditingController(text: widget.selfIntroduction);
  }

  @override
  void dispose() {
    _selfIntroController.dispose();
    _jobTitleController.dispose();
    _jobPostingController.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    final jobTitle = _jobTitleController.text.trim();
    if (jobTitle.isEmpty) {
      return;
    }

    final selfIntro = _selfIntroController.text.trim();
    if (_startWithSelfIntro && selfIntro.isEmpty) {
      setState(() => _showSelfIntroError = true);
      return;
    }

    // OpenAI(미국) 전송 동의 전에는 시작하지 않는다. 한 번 동의하면 다시 묻지 않는다.
    final consented = await ref.read(openAiConsentProvider.future).catchError((_) => false);
    if (!consented) {
      if (!mounted) return;
      final agreed = await showDialog<bool>(context: context, builder: (_) => const _OpenAiConsentDialog());
      if (agreed != true || !mounted) return;
      await ref.read(openAiConsentProvider.notifier).grant();
    }

    // 자기소개로 시작하면 자기소개가 첫 사용자 메시지가 된다. 면접관 응답은 채팅 화면이 한 번만 요청한다.
    final session = InterviewSession(
      jobTitle: jobTitle,
      jobPosting: _jobPostingController.text.trim(),
      messages: _startWithSelfIntro
          ? [InterviewMessage(role: MessageRole.user, content: selfIntro, createdAt: DateTime.now())]
          : const [],
    );
    await ref.read(interviewRepositoryProvider).save(session);
    if (_startWithSelfIntro) {
      ref.read(pendingFirstMessageProvider.notifier).set(selfIntro);
    }
    ref.invalidate(interviewSessionProvider);
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('지원 직무를 입력하세요'),
          const SizedBox(height: 8),
          TextField(
            controller: _jobTitleController,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '예: 백엔드 개발자',
            ),
          ),
          const SizedBox(height: 24),
          const Text('회사 채용공고 (선택)'),
          const SizedBox(height: 4),
          Text(
            '채용공고를 붙여넣으면 요구 역량과 우대사항에 맞춰 질문해요.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _jobPostingController,
            minLines: 5,
            maxLines: 10,
            maxLength: 3000,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '채용공고 텍스트를 붙여넣으세요.',
            ),
          ),
          const SizedBox(height: 8),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('자기소개로 시작하기'),
            subtitle: const Text('자기소개를 첫 답변으로 보내고, 면접관이 그 내용에서 꼬리 질문을 해요.'),
            value: _startWithSelfIntro,
            onChanged: (value) => setState(() {
              _startWithSelfIntro = value;
              _showSelfIntroError = false;
            }),
          ),
          if (_startWithSelfIntro) ...[
            const SizedBox(height: 8),
            TextField(
              controller: _selfIntroController,
              minLines: 4,
              maxLines: 8,
              maxLength: maxSelfIntroductionLength,
              onChanged: (_) {
                if (_showSelfIntroError) {
                  setState(() => _showSelfIntroError = false);
                }
              },
              decoration: InputDecoration(
                border: const OutlineInputBorder(),
                hintText: '자기소개를 입력하세요.',
                errorText: _showSelfIntroError ? '자기소개를 입력해 주세요.' : null,
              ),
            ),
          ],
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _start, child: const Text('면접 시작')),
        ],
      ),
    );
  }
}

class _OpenAiConsentDialog extends StatelessWidget {
  const _OpenAiConsentDialog();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('AI 모의면접 데이터 전송 동의'),
      content: const SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '모의면접에서 입력한 이력서·채용공고·자기소개·대화가 AI 응답 생성을 위해 OpenAI(미국)로 전송됩니다. '
              '비회원의 이력서·대화 기록은 기기에만 저장됩니다. '
              '동의하지 않으면 모의면접은 이용할 수 없지만 문제풀이 등 다른 기능은 그대로 이용할 수 있습니다.',
            ),
            SizedBox(height: 8),
            LegalLinkButtons(),
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('동의하지 않음')),
        FilledButton(onPressed: () => Navigator.of(context).pop(true), child: const Text('동의하고 시작')),
      ],
    );
  }
}

class _ChatView extends ConsumerStatefulWidget {
  const _ChatView({required this.session, required this.resumeText});

  final InterviewSession session;
  final String resumeText;

  @override
  ConsumerState<_ChatView> createState() => _ChatViewState();
}

class _ChatViewState extends ConsumerState<_ChatView> {
  late List<InterviewMessage> _messages;
  final _inputController = TextEditingController();
  final _listening = ValueNotifier<bool>(false);

  bool _isSending = false;
  String _draftReply = '';
  String? _errorMessage;
  String? _pendingRetryMessage;
  UsageStatus? _usage;
  bool _isRateLimited = false;
  String? _rateLimitBlockedBy;

  @override
  void initState() {
    super.initState();
    _messages = List.of(widget.session.messages);
    _loadInitialUsage();
    // 시작 화면에서 자기소개로 시작한 경우에만 첫 응답을 한 번 요청한다. 재진입 땐 비어 있어 호출하지 않는다.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final first = ref.read(pendingFirstMessageProvider.notifier).take();
      if (first != null) {
        _requestReply(first);
      }
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _listening.dispose();
    super.dispose();
  }

  Future<void> _loadInitialUsage() async {
    try {
      final usage = await ref.read(interviewChatClientProvider).fetchUsage();
      if (mounted) {
        setState(() => _usage = usage);
      }
    } catch (_) {
      // 배너 초기값 조회 실패는 무시한다. 메시지 전송 시 다시 갱신된다.
    }
  }

  Future<void> _persist() {
    return ref.read(interviewRepositoryProvider).save(widget.session.copyWithMessages(_messages));
  }

  Future<void> _newInterview() async {
    await ref.read(interviewRepositoryProvider).clear();
    ref.invalidate(interviewSessionProvider);
  }

  Future<void> _submit() async {
    final text = _inputController.text.trim();
    if (text.isEmpty || _isSending) {
      return;
    }

    setState(() {
      _messages = [
        ..._messages,
        InterviewMessage(role: MessageRole.user, content: text, createdAt: DateTime.now()),
      ];
    });
    _inputController.clear();
    await _persist();
    await _requestReply(text);
  }

  Future<void> _retry() async {
    final message = _pendingRetryMessage;
    if (message == null) {
      return;
    }
    await _requestReply(message);
  }

  Future<void> _requestReply(String userMessage) async {
    setState(() {
      _isSending = true;
      _draftReply = '';
      _errorMessage = null;
      _isRateLimited = false;
      _rateLimitBlockedBy = null;
      _pendingRetryMessage = null;
    });

    final history = _messages.sublist(0, _messages.length - 1);
    final client = ref.read(interviewChatClientProvider);
    final stream = client.streamReply(
      jobTitle: widget.session.jobTitle,
      jobPosting: widget.session.jobPosting,
      resumeText: widget.resumeText,
      history: history,
      message: userMessage,
      onUsage: (usage) {
        if (mounted) {
          setState(() => _usage = usage);
        }
      },
    );

    try {
      await for (final chunk in stream) {
        if (!mounted) return;
        setState(() => _draftReply += chunk);
      }

      if (!mounted) return;
      final reply = _draftReply;
      setState(() {
        _messages = [
          ..._messages,
          InterviewMessage(role: MessageRole.assistant, content: reply, createdAt: DateTime.now()),
        ];
        _isSending = false;
        _draftReply = '';
      });
      await _persist();
    } on InterviewRateLimitedException catch (error) {
      if (!mounted) return;
      setState(() {
        _isSending = false;
        _draftReply = '';
        _isRateLimited = true;
        _rateLimitBlockedBy = error.blockedBy;
        _usage = error.usage;
      });
    } on InterviewChatException catch (error) {
      if (!mounted) return;
      setState(() {
        _isSending = false;
        _draftReply = '';
        _errorMessage = error.message;
        _pendingRetryMessage = userMessage;
      });
    }
  }

  String _usageBannerText() {
    return switch (_usage) {
      null => '오늘 남은 면접 횟수를 확인하는 중입니다.',
      GuestUsageStatus(:final deviceRemaining) => '오늘 남은 면접 횟수: $deviceRemaining회',
      MemberUsageStatus(:final remaining) => '오늘 남은 면접 횟수: $remaining회',
    };
  }

  String _rateLimitedMessage() {
    return switch (_rateLimitBlockedBy) {
      'device' => '오늘 이 기기에서 사용할 수 있는 면접 횟수를 모두 사용했습니다.',
      'ip' => '현재 네트워크에서 사용할 수 있는 면접 횟수를 모두 사용했습니다.',
      _ => '오늘 사용할 수 있는 면접 횟수를 모두 사용했습니다.',
    };
  }

  @override
  Widget build(BuildContext context) {
    final isBlocked = _isRateLimited;

    return Column(
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          color: Theme.of(context).colorScheme.surfaceContainerLow,
          child: Row(
            children: [
              Expanded(child: Text(_usageBannerText())),
              TextButton(onPressed: _newInterview, child: const Text('새 면접 시작')),
            ],
          ),
        ),
        if (isBlocked)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: Theme.of(context).colorScheme.errorContainer,
            child: Text(
              _rateLimitedMessage(),
              style: TextStyle(color: Theme.of(context).colorScheme.onErrorContainer),
            ),
          ),
        Expanded(
          child: _messages.isEmpty && !_isSending
              ? const Center(child: Text('첫 메시지를 보내 면접을 시작하세요.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _messages.length + (_isSending ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index < _messages.length) {
                      return _MessageBubble(message: _messages[index]);
                    }
                    return _MessageBubble(
                      message: InterviewMessage(
                        role: MessageRole.assistant,
                        content: _draftReply,
                        createdAt: DateTime.now(),
                      ),
                    );
                  },
                ),
        ),
        if (_errorMessage != null)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
                TextButton(onPressed: _retry, child: const Text('다시 시도')),
              ],
            ),
          ),
        SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: ValueListenableBuilder<bool>(
                    valueListenable: _listening,
                    builder: (context, listening, _) => TextField(
                      controller: _inputController,
                      enabled: !_isSending && !isBlocked,
                      decoration: InputDecoration(
                        border: const OutlineInputBorder(),
                        hintText: listening ? '듣고 있어요. 말씀하세요…' : '메시지를 입력하세요',
                        enabledBorder: listening
                            ? OutlineInputBorder(
                                borderSide: BorderSide(color: Theme.of(context).colorScheme.error, width: 2),
                              )
                            : null,
                      ),
                      onSubmitted: (_) => _submit(),
                    ),
                  ),
                ),
                DictationButton(controller: _inputController, listening: _listening, enabled: !_isSending && !isBlocked),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _isSending || isBlocked ? null : _submit,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({required this.message});

  final InterviewMessage message;

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == MessageRole.user;
    final colorScheme = Theme.of(context).colorScheme;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser ? colorScheme.primaryContainer : colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(message.content.isEmpty ? '...' : message.content),
      ),
    );
  }
}
