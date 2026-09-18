import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../categories/presentation/categories_providers.dart';
import '../domain/practice_mode.dart';
import 'practice_providers.dart';

/// 문제 목록 화면. 주제에 속한 문제를 보여준다.
class QuestionListPage extends ConsumerWidget {
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
  Widget build(BuildContext context, WidgetRef ref) {
    final topicAsync = ref.watch(categoryBySlugProvider(topicSlug));

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
                onPressed: () => ref.invalidate(categoryBySlugProvider(topicSlug)),
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
                        '/categories/$fieldSlug/${mode.pathValue}/$topicSlug/${question.id}',
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
