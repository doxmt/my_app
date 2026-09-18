import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../categories/presentation/categories_providers.dart';
import '../domain/practice_mode.dart';

/// 분야 화면. 학습하기 / 문제풀기 중 하나를 고른다.
class FieldPage extends ConsumerWidget {
  const FieldPage({super.key, required this.fieldSlug});

  final String fieldSlug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fieldAsync = ref.watch(categoryBySlugProvider(fieldSlug));

    return Scaffold(
      appBar: AppBar(title: Text(fieldAsync.value?.name ?? '분야')),
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
          return ListView(
            children: [
              ListTile(
                title: const Text('학습하기'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  context.push('/categories/$fieldSlug/${PracticeMode.study.pathValue}');
                },
              ),
              ListTile(
                title: const Text('문제풀기'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  context.push('/categories/$fieldSlug/${PracticeMode.practice.pathValue}');
                },
              ),
            ],
          );
        },
      ),
    );
  }
}
