import 'wrong_note.dart';

/// 오답노트 리포지토리 인터페이스. M4에서 Supabase 구현을 끼울 자리.
abstract class WrongNoteRepository {
  Future<List<WrongNote>> fetchAll();

  /// 같은 questionId가 있으면 덮어쓴다.
  Future<void> save(WrongNote note);

  Future<void> setResolved(String questionId, bool isResolved);

  Future<void> delete(String questionId);
}
