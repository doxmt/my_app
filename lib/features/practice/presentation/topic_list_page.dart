import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../categories/presentation/categories_providers.dart';
import '../domain/practice_mode.dart';

/// 주제 목록 화면. 분야의 하위 주제를 보여준다.
class TopicListPage extends ConsumerWidget {
  const TopicListPage({super.key, required this.fieldSlug, required this.mode});

  final String fieldSlug;
  final PracticeMode mode;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fieldAsync = ref.watch(categoryBySlugProvider(fieldSlug));

    return Scaffold(
      appBar: AppBar(title: Text(mode == PracticeMode.study ? '학습하기' : '문제풀기')),
      body: fieldAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('분야를 불러오지 못했습니다.'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(categoryBySlugProvider(fieldSlug)),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (field) {
          final topicsAsync = ref.watch(childCategoriesProvider(field.id));
          return topicsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stackTrace) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('주제 목록을 불러오지 못했습니다.'),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () => ref.invalidate(childCategoriesProvider(field.id)),
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ),
            data: (topics) {
              if (topics.isEmpty) {
                return const Center(child: Text('아직 등록된 주제가 없습니다.'));
              }
              return ListView.builder(
                itemCount: topics.length,
                itemBuilder: (context, index) {
                  final topic = topics[index];
                  return ListTile(
                    title: Text(topic.name),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      context.push('/categories/$fieldSlug/${mode.pathValue}/${topic.slug}');
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
