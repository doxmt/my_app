import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../app/app_config.dart';
import '../../../core/device/device_id.dart';
import '../../../core/storage/local_json_store.dart';
import '../data/http_interview_chat_client.dart';
import '../data/local_interview_repository.dart';
import '../domain/interview_chat_client.dart';
import '../domain/interview_repository.dart';
import '../domain/interview_session.dart';

final interviewRepositoryProvider = Provider<InterviewRepository>((ref) {
  return LocalInterviewRepository(ref.watch(localJsonStoreProvider));
});

final interviewSessionProvider = FutureProvider<InterviewSession?>((ref) {
  return ref.watch(interviewRepositoryProvider).fetch();
});

final interviewChatClientProvider = Provider<InterviewChatClient>((ref) {
  final config = ref.watch(appConfigProvider);
  return HttpInterviewChatClient(
    client: http.Client(),
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
    deviceIdProvider: () => ref.read(deviceIdProvider.future),
  );
});
