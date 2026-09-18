import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/question.dart';
import '../domain/question_repository.dart';

class SupabaseQuestionRepository implements QuestionRepository {
  SupabaseQuestionRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<List<Question>> fetchQuestionsByCategory(String categoryId) async {
    final rows = await _client
        .from('questions')
        .select()
        .eq('category_id', categoryId)
        .order('created_at', ascending: true);

    return rows.map((row) => Question.fromJson(row)).toList();
  }

  @override
  Future<Question> fetchQuestionById(String id) async {
    final row = await _client.from('questions').select().eq('id', id).single();

    return Question.fromJson(row);
  }
}
