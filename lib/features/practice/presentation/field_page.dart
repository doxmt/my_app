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
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _ModeCard(
                    icon: Icons.menu_book_outlined,
                    label: '학습하기',
                    onTap: () {
                      context.push('/categories/$fieldSlug/${PracticeMode.study.pathValue}');
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ModeCard(
                    icon: Icons.edit_outlined,
                    label: '문제풀기',
                    onTap: () {
                      context.push('/categories/$fieldSlug/${PracticeMode.practice.pathValue}');
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({required this.icon, required this.label, required this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 160,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: colorScheme.primary, size: 32),
                const SizedBox(height: 12),
                Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
