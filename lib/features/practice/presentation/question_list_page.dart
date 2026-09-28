import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../categories/presentation/categories_providers.dart';
import '../domain/practice_mode.dart';
import 'practice_providers.dart';

/// 문제 목록 화면.
///
/// 학습하기는 주제에 속한 문제를 전부 나열해 원하는 것을 골라 보게 한다.
/// 문제풀기는 목록을 보여주지 않고, 로드되는 즉시 이 주제의 문제 중 하나를
/// 무작위로 골라 문제 상세 화면으로 바로 이동한다(뒤로 가면 주제 목록으로 돌아간다).
class QuestionListPage extends ConsumerStatefulWidget {
  const QuestionListPage({
    super.key,
    required this.fieldSlug,
    required this.mode,
    required this.topicSlug,
  });

  final String fieldSlug;
  final PracticeMode mode;
  final String topicSlug;

  @override
  ConsumerState<QuestionListPage> createState() => _QuestionListPageState();
}

class _QuestionListPageState extends ConsumerState<QuestionListPage> {
  bool _redirected = false;

  void _redirectToRandomQuestion(String questionId) {
    if (_redirected) return;
    _redirected = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.pushReplacement(
        '/categories/${widget.fieldSlug}/${widget.mode.pathValue}/${widget.topicSlug}/$questionId',
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final topicAsync = ref.watch(categoryBySlugProvider(widget.topicSlug));

    return Scaffold(
      appBar: AppBar(title: Text(topicAsync.value?.name ?? '주제')),
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
                  const Text('문제 목록을 불러오지 못했습니다.'),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(questionsByCategoryProvider(topic.id)),
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ),
            data: (questions) {
              if (questions.isEmpty) {
                return const Center(child: Text('이 주제에는 아직 문제가 없습니다.'));
              }

              if (widget.mode == PracticeMode.practice) {
                final randomQuestion = questions[Random().nextInt(questions.length)];
                _redirectToRandomQuestion(randomQuestion.id);
                return const Center(child: CircularProgressIndicator());
              }

              return ListView.builder(
                itemCount: questions.length,
                itemBuilder: (context, index) {
                  final question = questions[index];
                  return ListTile(
                    title: Text(
                      question.prompt,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      context.push(
                        '/categories/${widget.fieldSlug}/${widget.mode.pathValue}/${widget.topicSlug}/${question.id}',
                      );
                    },
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
