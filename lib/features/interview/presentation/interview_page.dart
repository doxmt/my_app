import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../categories/presentation/categories_providers.dart';
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
                    onPressed: () => context.push('/me/resume'),
                    child: const Text('이력서 입력하기'),
                  ),
                ],
              ),
            );
          }
          return _InterviewBody(resumeText: resume.text);
        },
      ),
    );
  }
}

class _InterviewBody extends ConsumerWidget {
  const _InterviewBody({required this.resumeText});

  final String resumeText;

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
          return _CategoryJobForm(resumeText: resumeText);
        }
        return _ChatView(session: session, resumeText: resumeText);
      },
    );
  }
}

class _CategoryJobForm extends ConsumerStatefulWidget {
  const _CategoryJobForm({required this.resumeText});

  final String resumeText;

  @override
  ConsumerState<_CategoryJobForm> createState() => _CategoryJobFormState();
}

class _CategoryJobFormState extends ConsumerState<_CategoryJobForm> {
  final _jobTitleController = TextEditingController();
  String? _selectedCategorySlug;
  String? _selectedCategoryName;

  @override
  void dispose() {
    _jobTitleController.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    final categorySlug = _selectedCategorySlug;
    final categoryName = _selectedCategoryName;
    final jobTitle = _jobTitleController.text.trim();
    if (categorySlug == null || categoryName == null || jobTitle.isEmpty) {
      return;
    }

    final session = InterviewSession(
      categorySlug: categorySlug,
      categoryName: categoryName,
      jobTitle: jobTitle,
      messages: const [],
    );
    await ref.read(interviewRepositoryProvider).save(session);
    ref.invalidate(interviewSessionProvider);
  }

  @override
  Widget build(BuildContext context) {
    final categoriesAsync = ref.watch(categoriesProvider);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('지원 분야를 선택하세요'),
          const SizedBox(height: 8),
          categoriesAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => const Text('분야 목록을 불러오지 못했습니다.'),
            data: (categories) {
              if (categories.isEmpty) {
                return const Text('아직 등록된 분야가 없습니다.');
              }
              return Wrap(
                spacing: 8,
                children: categories.map((category) {
                  return ChoiceChip(
                    label: Text(category.name),
                    selected: _selectedCategorySlug == category.slug,
                    onSelected: (selected) {
                      setState(() {
                        _selectedCategorySlug = selected ? category.slug : null;
                        _selectedCategoryName = selected ? category.name : null;
                      });
                    },
                  );
                }).toList(),
              );
            },
          ),
          const SizedBox(height: 16),
          const Text('지원 직무를 입력하세요'),
          const SizedBox(height: 8),
          TextField(
            controller: _jobTitleController,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: '예: 백엔드 개발자',
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(onPressed: _start, child: const Text('면접 시작')),
        ],
      ),
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
  }

  @override
  void dispose() {
    _inputController.dispose();
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
      categoryName: widget.session.categoryName,
      jobTitle: widget.session.jobTitle,
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
      GuestUsageStatus(:final deviceRemaining, :final ipRemaining) =>
        '오늘 남은 면접 횟수: $deviceRemaining회 (네트워크 전체 $ipRemaining회)',
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
                  child: TextField(
                    controller: _inputController,
                    enabled: !_isSending && !isBlocked,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: '메시지를 입력하세요',
                    ),
                    onSubmitted: (_) => _submit(),
                  ),
                ),
                const SizedBox(width: 8),
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
