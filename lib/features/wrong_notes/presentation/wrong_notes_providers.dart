import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_json_store.dart';
import '../data/local_wrong_note_repository.dart';
import '../domain/wrong_note.dart';
import '../domain/wrong_note_repository.dart';

final wrongNoteRepositoryProvider = Provider<WrongNoteRepository>((ref) {
  return LocalWrongNoteRepository(ref.watch(localJsonStoreProvider));
});

final wrongNotesProvider = FutureProvider<List<WrongNote>>((ref) {
  return ref.watch(wrongNoteRepositoryProvider).fetchAll();
});
