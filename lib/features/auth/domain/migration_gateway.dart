import '../../resume/domain/resume.dart';
import '../../wrong_notes/domain/wrong_note.dart';

/// 로컬→서버 데이터 이전에 필요한 최소 서버 동작만 노출하는 게이트웨이.
/// [LocalDataMigrationService]가 원자적 원격 호출과 로컬 판단 로직을 분리해 테스트할 수 있게 한다.
abstract class MigrationGateway {
  /// 넘겨받은 questionId 중 실제로 `questions` 테이블에 존재하는 것만 돌려준다.
  Future<Set<String>> existingQuestionIds(List<String> questionIds);

  /// `unique(user_id, question_id)` 충돌 시 서버 값을 유지하고 무시한다.
  Future<void> upsertWrongNotesIgnoringDuplicates(String userId, List<WrongNote> notes);

  Future<bool> hasResume(String userId);

  Future<void> insertResume(String userId, Resume resume);
}
