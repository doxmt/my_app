import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'wrong_notes_providers.dart';

/// 오답노트 화면. 목록, 해결 처리 토글, 삭제, 문제 상세로 이동을 제공한다.
class WrongNotesPage extends ConsumerWidget {
  const WrongNotesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(wrongNotesProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('오답노트')),
      body: notesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('오답노트를 불러오지 못했습니다.'),
              const SizedBox(height: 8),
              ElevatedButton(
                onPressed: () => ref.invalidate(wrongNotesProvider),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
        data: (notes) {
          if (notes.isEmpty) {
            return const Center(child: Text('아직 저장된 오답노트가 없습니다.'));
          }
          return ListView.builder(
            itemCount: notes.length,
            itemBuilder: (context, index) {
              final note = notes[index];
              return ListTile(
                title: Text(note.questionPrompt),
                subtitle: Text(note.isResolved ? '해결됨' : '미해결'),
                onTap: () {
                  context.push('/me/wrong-notes/${note.questionId}');
                },
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Checkbox(
                      value: note.isResolved,
                      onChanged: (value) async {
                        await ref
                            .read(wrongNoteRepositoryProvider)
                            .setResolved(note.questionId, value ?? false);
                        ref.invalidate(wrongNotesProvider);
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () async {
                        await ref
                            .read(wrongNoteRepositoryProvider)
                            .delete(note.questionId);
                        ref.invalidate(wrongNotesProvider);
                      },
                    ),
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
