import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_json_store.dart';
import '../../../core/supabase/supabase_client_provider.dart';
import '../../auth/presentation/auth_providers.dart';
import '../data/local_wrong_note_repository.dart';
import '../data/supabase_wrong_note_repository.dart';
import '../domain/wrong_note.dart';
import '../domain/wrong_note_repository.dart';

final wrongNoteRepositoryProvider = Provider<WrongNoteRepository>((ref) {
  final userId = ref.watch(currentUserIdProvider);
  if (userId == null) {
    return LocalWrongNoteRepository(ref.watch(localJsonStoreProvider));
  }
  return SupabaseWrongNoteRepository(ref.watch(supabaseClientProvider), userId);
});

final wrongNotesProvider = FutureProvider<List<WrongNote>>((ref) {
  return ref.watch(wrongNoteRepositoryProvider).fetchAll();
});
