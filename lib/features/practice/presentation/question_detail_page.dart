import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/speech/dictation_button.dart';
import '../../categories/presentation/categories_providers.dart';
import '../../wrong_notes/domain/wrong_note.dart';
import '../../wrong_notes/presentation/wrong_notes_providers.dart';
import '../domain/practice_mode.dart';
import '../domain/question.dart';
import '../domain/random_pick.dart';
import 'practice_providers.dart';

/// 문제 상세 화면. 학습하기는 모범답안을 바로 보여주고,
/// 문제풀기는 답변 입력 → 모범답안 보기 → 자가 채점 → 오답노트 저장 순서로 진행한다.
class QuestionDetailPage extends ConsumerStatefulWidget {
  const QuestionDetailPage({
    super.key,
    required this.fieldSlug,
    required this.mode,
    required this.topicSlug,
    required this.questionId,
    this.randomScope,
  });

  final String fieldSlug;
  final PracticeMode mode;
  final String topicSlug;
  final String questionId;

  /// 랜덤으로 진입했을 때의 범위(`?random=field|topic`). 학습하기에서만 "다음 랜덤 문제"에 쓴다.
  final RandomScope? randomScope;

  @override
  ConsumerState<QuestionDetailPage> createState() => _QuestionDetailPageState();
}

class _QuestionDetailPageState extends ConsumerState<QuestionDetailPage> {
  final _answerController = TextEditingController();
  final _listening = ValueNotifier<bool>(false);
  bool _revealed = false;
  bool? _isCorrect;
  bool _saved = false;
  bool _pickingRandom = false;

  @override
  void dispose() {
    _answerController.dispose();
    _listening.dispose();
    super.dispose();
  }

  void _goTo(String questionId) {
    context.pushReplacement(
      '/categories/${widget.fieldSlug}/${widget.mode.pathValue}/${widget.topicSlug}/$questionId',
    );
  }

  /// "다음 랜덤 문제". 범위(분야 전체/현재 주제)에서 현재 문제를 뺀 문제 하나로 이동한다.
  /// 뒤로 가기 스택이 쌓이지 않도록 replace로 이동하고, 범위 쿼리는 그대로 유지한다.
  Future<void> _goToNextRandom(List<Question> topicQuestions) async {
    if (_pickingRandom) return;
    final scope = widget.randomScope!;
    setState(() => _pickingRandom = true);
    try {
      final List<RandomEntry> pool;
      if (scope == RandomScope.topic) {
        pool = randomEntriesOfTopic(widget.topicSlug, topicQuestions);
      } else {
        final field = await ref.read(categoryBySlugProvider(widget.fieldSlug).future);
        final topics = await ref.read(childCategoriesProvider(field.id).future);
        final results = await Future.wait(
          topics.map((topic) => ref.read(questionsByCategoryProvider(topic.id).future)),
        );
        pool = [for (var i = 0; i < topics.length; i++) ...randomEntriesOfTopic(topics[i].slug, results[i])];
      }
      if (!mounted) return;
      final pick = pickRandomEntry(pool, Random(), excludeQuestionId: widget.questionId);
      if (pick == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('다른 문제가 없습니다.')));
        return;
      }
      context.pushReplacement(
        '/categories/${widget.fieldSlug}/${widget.mode.pathValue}/${pick.topicSlug}/${pick.questionId}?random=${scope.queryValue}',
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('문제를 불러오지 못했습니다.')));
      }
    } finally {
      if (mounted) setState(() => _pickingRandom = false);
    }
  }

  Future<void> _saveToWrongNotes(Question question, String categoryId) async {
    await ref.read(wrongNoteRepositoryProvider).save(
      WrongNote(
        questionId: question.id,
        categoryId: categoryId,
        questionPrompt: question.prompt,
        savedAt: DateTime.now(),
      ),
    );
    ref.invalidate(wrongNotesProvider);
    setState(() => _saved = true);
  }

  @override
  Widget build(BuildContext context) {
    final topicAsync = ref.watch(categoryBySlugProvider(widget.topicSlug));

    return Scaffold(
      appBar: AppBar(title: Text(widget.mode == PracticeMode.study ? '학습하기' : '문제풀기')),
      body: topicAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('주제를 불러오지 못했습니다.'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(categoryBySlugProvider(widget.topicSlug)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (topic) {
          final questionsAsync = ref.watch(questionsByCategoryProvider(topic.id));
          return questionsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('문제를 불러오지 못했습니다.'),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(questionsByCategoryProvider(topic.id)),
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ),
            data: (questions) {
              final index = questions.indexWhere((q) => q.id == widget.questionId);
              if (index == -1) {
                return const Center(child: Text('문제를 찾을 수 없습니다.'));
              }
              final question = questions[index];
              final previousId = index > 0 ? questions[index - 1].id : null;
              final nextId = index < questions.length - 1 ? questions[index + 1].id : null;
              // 주제 범위는 이 주제에 다른 문제가 있을 때만, 분야 범위는 누를 때 풀을 불러와 확인한다.
              final randomScope = widget.randomScope;
              final showNextRandom =
                  widget.mode == PracticeMode.study &&
                  randomScope != null &&
                  (randomScope == RandomScope.field || questions.length > 1);

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(question.prompt, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 24),
                    if (widget.mode == PracticeMode.study)
                      _ModelAnswer(question: question)
                    else
                      _PracticeBody(
                        question: question,
                        answerController: _answerController,
                        listening: _listening,
                        revealed: _revealed,
                        isCorrect: _isCorrect,
                        saved: _saved,
                        onReveal: () => setState(() => _revealed = true),
                        onGrade: (correct) => setState(() => _isCorrect = correct),
                        onSave: () => _saveToWrongNotes(question, topic.id),
                      ),
                    const SizedBox(height: 32),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        OutlinedButton(
                          onPressed: previousId == null ? null : () => _goTo(previousId),
                          child: const Text('이전'),
                        ),
                        OutlinedButton(
                          onPressed: nextId == null ? null : () => _goTo(nextId),
                          child: const Text('다음'),
                        ),
                      ],
                    ),
                    if (showNextRandom) ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _pickingRandom ? null : () => _goToNextRandom(questions),
                          icon: const Icon(Icons.shuffle),
                          label: const Text('다음 랜덤 문제'),
                        ),
                      ),
                    ],
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ModelAnswer extends StatelessWidget {
  const _ModelAnswer({required this.question});

  final Question question;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('모범답안', style: Theme.of(context).textTheme.labelLarge),
        const SizedBox(height: 8),
        Text(question.modelAnswer ?? '모범답안이 아직 없습니다.'),
      ],
    );
  }
}

class _PracticeBody extends StatelessWidget {
  const _PracticeBody({
    required this.question,
    required this.answerController,
    required this.listening,
    required this.revealed,
    required this.isCorrect,
    required this.saved,
    required this.onReveal,
    required this.onGrade,
    required this.onSave,
  });

  final Question question;
  final TextEditingController answerController;
  final ValueNotifier<bool> listening;
  final bool revealed;
  final bool? isCorrect;
  final bool saved;
  final VoidCallback onReveal;
  final ValueChanged<bool> onGrade;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Align(
          alignment: Alignment.centerRight,
          child: DictationButton(controller: answerController, listening: listening, enabled: !revealed),
        ),
        ValueListenableBuilder<bool>(
          valueListenable: listening,
          builder: (context, isListening, _) => TextField(
            controller: answerController,
            enabled: !revealed,
            maxLines: 6,
            decoration: InputDecoration(
              border: const OutlineInputBorder(),
              hintText: isListening ? '듣고 있어요. 말씀하세요…' : '답변을 입력하세요',
              enabledBorder: isListening
                  ? OutlineInputBorder(
                      borderSide: BorderSide(color: Theme.of(context).colorScheme.error, width: 2),
                    )
                  : null,
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (!revealed)
          ElevatedButton(onPressed: onReveal, child: const Text('모범답안 보기'))
        else ...[
          Text('모범답안', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Text(question.modelAnswer ?? '모범답안이 아직 없습니다.'),
          const SizedBox(height: 24),
          Text('자가 채점', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Row(
            children: [
              FilledButton(
                onPressed: () => onGrade(true),
                style: isCorrect == true
                    ? null
                    : FilledButton.styleFrom(backgroundColor: Colors.grey),
                child: const Text('정답'),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () => onGrade(false),
                style: isCorrect == false
                    ? null
                    : FilledButton.styleFrom(backgroundColor: Colors.grey),
                child: const Text('오답'),
              ),
            ],
          ),
          if (isCorrect != null) ...[
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: saved ? null : onSave,
              child: Text(saved ? '오답노트에 저장됨' : '오답노트에 저장'),
            ),
          ],
        ],
      ],
    );
  }
}
