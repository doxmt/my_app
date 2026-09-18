import 'resume.dart';

/// 이력서 저장소 인터페이스. M4에서 Supabase 구현을 끼울 자리.
abstract class ResumeRepository {
  Future<Resume?> fetch();

  Future<void> save(Resume resume);
}
