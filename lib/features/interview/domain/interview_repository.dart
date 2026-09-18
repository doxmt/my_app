import 'interview_session.dart';

/// 면접 세션(대화) 로컬 저장소 인터페이스. M4에서 Supabase 구현을 끼울 자리.
abstract class InterviewRepository {
  Future<InterviewSession?> fetch();

  Future<void> save(InterviewSession session);

  Future<void> clear();
}
