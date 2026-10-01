import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/resume.dart';
import '../domain/resume_repository.dart';

class SupabaseResumeRepository implements ResumeRepository {
  SupabaseResumeRepository(this._client, this._userId);

  final SupabaseClient _client;
  final String _userId;

  @override
  Future<Resume?> fetch() async {
    final rows = await _client
        .from('resumes')
        .select('source_type, extracted_text, self_introduction, created_at')
        .eq('user_id', _userId)
        .order('created_at', ascending: false)
        .limit(1);

    if (rows.isEmpty) {
      return null;
    }
    final row = rows.first;
    return Resume(
      sourceType: _sourceTypeFromDb(row['source_type'] as String),
      text: row['extracted_text'] as String? ?? '',
      updatedAt: DateTime.parse(row['created_at'] as String),
      selfIntroduction: row['self_introduction'] as String? ?? '',
    );
  }

  @override
  Future<void> save(Resume resume) async {
    final existing = await _client
        .from('resumes')
        .select('id')
        .eq('user_id', _userId)
        .order('created_at', ascending: false)
        .limit(1);

    final payload = {
      'user_id': _userId,
      'source_type': _sourceTypeToDb(resume.sourceType),
      'extracted_text': resume.text,
      'self_introduction': resume.selfIntroduction.isEmpty ? null : resume.selfIntroduction,
    };

    if (existing.isEmpty) {
      await _client.from('resumes').insert(payload);
      return;
    }

    final id = existing.first['id'] as String;
    await _client.from('resumes').update(payload).eq('id', id);
  }

  String _sourceTypeToDb(ResumeSourceType type) {
    return type == ResumeSourceType.paste ? 'text' : 'pdf';
  }

  ResumeSourceType _sourceTypeFromDb(String value) {
    return value == 'text' ? ResumeSourceType.paste : ResumeSourceType.pdf;
  }
}
