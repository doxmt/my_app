import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/supabase/supabase_client_provider.dart';
import '../data/supabase_question_repository.dart';
import '../domain/question.dart';
import '../domain/question_repository.dart';

final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  return SupabaseQuestionRepository(ref.watch(supabaseClientProvider));
});

final questionsByCategoryProvider = FutureProvider.family<List<Question>, String>((
  ref,
  categoryId,
) {
  return ref.watch(questionRepositoryProvider).fetchQuestionsByCategory(categoryId);
});

final questionByIdProvider = FutureProvider.family<Question, String>((ref, id) {
  return ref.watch(questionRepositoryProvider).fetchQuestionById(id);
});
