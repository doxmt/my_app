import '../../../core/storage/local_json_store.dart';
import '../domain/interview_repository.dart';
import '../domain/interview_session.dart';

const _storeKey = 'interview_session';
const _schemaVersion = 1;

class LocalInterviewRepository implements InterviewRepository {
  LocalInterviewRepository(this._store);

  final LocalJsonStore _store;

  @override
  Future<InterviewSession?> fetch() async {
    final json = await _store.read(_storeKey);
    if (json == null) {
      return null;
    }
    final items = json['items'] as List<dynamic>? ?? const [];
    if (items.isEmpty) {
      return null;
    }
    return InterviewSession.fromJson(items.first as Map<String, dynamic>);
  }

  @override
  Future<void> save(InterviewSession session) {
    return _store.write(_storeKey, {
      'version': _schemaVersion,
      'items': [session.toJson()],
    });
  }

  @override
  Future<void> clear() {
    return _store.write(_storeKey, {'version': _schemaVersion, 'items': []});
  }
}
