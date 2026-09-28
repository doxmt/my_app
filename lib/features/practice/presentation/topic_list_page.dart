import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../categories/domain/category.dart';
import '../../categories/presentation/categories_providers.dart';
import '../domain/practice_mode.dart';
import 'practice_providers.dart';

/// 주제 목록 화면. 분야의 하위 주제를 보여준다.
/// 문제풀기에서는 맨 앞에 "전체 랜덤" 카드를 추가로 보여준다. 이 카드를 누르면
/// 분야의 모든 주제를 합쳐 문제 하나를 무작위로 골라 바로 상세 화면으로 이동한다.
class TopicListPage extends ConsumerStatefulWidget {
  const TopicListPage({super.key, required this.fieldSlug, required this.mode});

  final String fieldSlug;
  final PracticeMode mode;

  @override
  ConsumerState<TopicListPage> createState() => _TopicListPageState();
}

class _TopicListPageState extends ConsumerState<TopicListPage> {
  bool _pickingRandom = false;

  Future<void> _pickGlobalRandom(List<Category> topics) async {
    if (_pickingRandom) return;
    setState(() => _pickingRandom = true);
    try {
      final results = await Future.wait(
        topics.map((topic) => ref.read(questionsByCategoryProvider(topic.id).future)),
      );
      final pool = <(String topicSlug, String questionId)>[];
      for (var i = 0; i < topics.length; i++) {
        for (final question in results[i]) {
          pool.add((topics[i].slug, question.id));
        }
      }
      if (!mounted) return;
      if (pool.isEmpty) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('아직 문제가 없습니다.')));
        return;
      }
      final pick = pool[Random().nextInt(pool.length)];
      if (!mounted) return;
      context.push('/categories/${widget.fieldSlug}/${widget.mode.pathValue}/${pick.$1}/${pick.$2}');
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('문제를 불러오지 못했습니다.')));
      }
    } finally {
      if (mounted) setState(() => _pickingRandom = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fieldSlug = widget.fieldSlug;
    final mode = widget.mode;
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
              final showGlobalRandom = mode == PracticeMode.practice;
              final itemCount = topics.length + (showGlobalRandom ? 1 : 0);
              return GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: 220,
                  mainAxisExtent: 140,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: itemCount,
                itemBuilder: (context, index) {
                  if (showGlobalRandom && index == 0) {
                    return _TopicCard(
                      label: '전체 랜덤',
                      icon: Icons.shuffle,
                      loading: _pickingRandom,
                      onTap: () => _pickGlobalRandom(topics),
                    );
                  }
                  final topic = topics[showGlobalRandom ? index - 1 : index];
                  return _TopicCard(
                    label: topic.name,
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

class _TopicCard extends StatelessWidget {
  const _TopicCard({
    required this.label,
    required this.onTap,
    this.icon = Icons.topic_outlined,
    this.loading = false,
  });

  final String label;
  final VoidCallback onTap;
  final IconData icon;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: loading ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading)
                SizedBox(
                  width: 32,
                  height: 32,
                  child: CircularProgressIndicator(color: colorScheme.primary),
                )
              else
                Icon(icon, color: colorScheme.primary, size: 32),
              const SizedBox(height: 12),
              Text(
                label,
                style: Theme.of(context).textTheme.titleMedium,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
