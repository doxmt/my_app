import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/wrong_note.dart';
import '../domain/wrong_note_repository.dart';

class SupabaseWrongNoteRepository implements WrongNoteRepository {
  SupabaseWrongNoteRepository(this._client, this._userId);

  final SupabaseClient _client;
  final String _userId;

  @override
  Future<List<WrongNote>> fetchAll() async {
    final rows = await _client
        .from('wrong_notes')
        .select('question_id, is_resolved, resolved_at, created_at, questions(category_id, prompt)')
        .eq('user_id', _userId)
        .order('created_at', ascending: false);

    return rows.map((row) {
      final question = row['questions'] as Map<String, dynamic>?;
      return WrongNote(
        questionId: row['question_id'] as String,
        categoryId: question?['category_id'] as String? ?? '',
        questionPrompt: question?['prompt'] as String? ?? '',
        savedAt: DateTime.parse(row['created_at'] as String),
        isResolved: row['is_resolved'] as bool? ?? false,
        resolvedAt: row['resolved_at'] == null
            ? null
            : DateTime.parse(row['resolved_at'] as String),
      );
    }).toList();
  }

  @override
  Future<void> save(WrongNote note) async {
    await _client
        .from('wrong_notes')
        .upsert({
          'user_id': _userId,
          'question_id': note.questionId,
          'is_resolved': note.isResolved,
          'resolved_at': note.resolvedAt?.toIso8601String(),
        }, onConflict: 'user_id,question_id');
  }

  @override
  Future<void> setResolved(String questionId, bool isResolved) async {
    await _client
        .from('wrong_notes')
        .update({
          'is_resolved': isResolved,
          'resolved_at': isResolved ? DateTime.now().toIso8601String() : null,
        })
        .eq('user_id', _userId)
        .eq('question_id', questionId);
  }

  @override
  Future<void> delete(String questionId) async {
    await _client
        .from('wrong_notes')
        .delete()
        .eq('user_id', _userId)
        .eq('question_id', questionId);
  }
}
