import 'package:supabase_flutter/supabase_flutter.dart';

import '../../resume/domain/resume.dart';
import '../../wrong_notes/domain/wrong_note.dart';
import '../domain/migration_gateway.dart';

class SupabaseMigrationGateway implements MigrationGateway {
  SupabaseMigrationGateway(this._client);

  final SupabaseClient _client;

  @override
  Future<Set<String>> existingQuestionIds(List<String> questionIds) async {
    final rows = await _client.from('questions').select('id').inFilter('id', questionIds);
    return rows.map((row) => row['id'] as String).toSet();
  }

  @override
  Future<void> upsertWrongNotesIgnoringDuplicates(String userId, List<WrongNote> notes) async {
    await _client
        .from('wrong_notes')
        .upsert(
          notes
              .map(
                (note) => {
                  'user_id': userId,
                  'question_id': note.questionId,
                  'is_resolved': note.isResolved,
                  'resolved_at': note.resolvedAt?.toIso8601String(),
                  'created_at': note.savedAt.toIso8601String(),
                },
              )
              .toList(),
          onConflict: 'user_id,question_id',
          ignoreDuplicates: true,
        );
  }

  @override
  Future<bool> hasResume(String userId) async {
    final rows = await _client.from('resumes').select('id').eq('user_id', userId).limit(1);
    return rows.isNotEmpty;
  }

  @override
  Future<void> insertResume(String userId, Resume resume) async {
    await _client.from('resumes').insert({
      'user_id': userId,
      'source_type': resume.sourceType == ResumeSourceType.paste ? 'text' : 'pdf',
      'extracted_text': resume.text,
    });
  }
}
