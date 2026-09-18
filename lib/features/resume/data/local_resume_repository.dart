import '../../../core/storage/local_json_store.dart';
import '../domain/resume.dart';
import '../domain/resume_repository.dart';

const _storeKey = 'resume';
const _schemaVersion = 1;

class LocalResumeRepository implements ResumeRepository {
  LocalResumeRepository(this._store);

  final LocalJsonStore _store;

  @override
  Future<Resume?> fetch() async {
    final json = await _store.read(_storeKey);
    if (json == null) {
      return null;
    }
    final items = json['items'] as List<dynamic>? ?? const [];
    if (items.isEmpty) {
      return null;
    }
    return Resume.fromJson(items.first as Map<String, dynamic>);
  }

  @override
  Future<void> save(Resume resume) {
    return _store.write(_storeKey, {
      'version': _schemaVersion,
      'items': [resume.toJson()],
    });
  }
}
