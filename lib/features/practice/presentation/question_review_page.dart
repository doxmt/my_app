import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'practice_providers.dart';

/// 오답노트에서 들어온 문제 리뷰 화면. 학습하기와 같이 모범답안을 바로 보여준다.
class QuestionReviewPage extends ConsumerWidget {
  const QuestionReviewPage({super.key, required this.questionId});

  final String questionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final questionAsync = ref.watch(questionByIdProvider(questionId));

    return Scaffold(
      appBar: AppBar(title: const Text('문제')),
      body: questionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('문제를 불러오지 못했습니다.'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(questionByIdProvider(questionId)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (question) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(question.prompt, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 24),
                Text('모범답안', style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Text(question.modelAnswer ?? '모범답안이 아직 없습니다.'),
              ],
            ),
          );
        },
      ),
    );
  }
}
