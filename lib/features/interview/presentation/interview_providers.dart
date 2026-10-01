import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../../../app/app_config.dart';
import '../../../core/device/device_id.dart';
import '../../../core/storage/local_json_store.dart';
import '../../../core/supabase/supabase_client_provider.dart';
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

/// 시작 화면에서 "자기소개로 시작하기"를 고른 직후, 채팅 화면이 면접관 응답을 한 번 요청할 첫 메시지.
/// 메모리에만 두고 채팅 화면이 꺼내 가며 비운다. 저장된 세션만 보고 자동으로 LLM을 호출하지 않기 위함이다.
class PendingFirstMessageNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void set(String message) => state = message;

  /// 값을 꺼내고 비운다. 이미 비어 있으면 null.
  String? take() {
    final message = state;
    state = null;
    return message;
  }
}

final pendingFirstMessageProvider = NotifierProvider<PendingFirstMessageNotifier, String?>(
  PendingFirstMessageNotifier.new,
);

final interviewChatClientProvider = Provider<InterviewChatClient>((ref) {
  final config = ref.watch(appConfigProvider);
  final client = HttpInterviewChatClient(
    client: http.Client(),
    supabaseUrl: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
    deviceIdProvider: () => ref.read(deviceIdProvider.future),
    accessTokenProvider: () async {
      return ref.read(supabaseClientProvider).auth.currentSession?.accessToken;
    },
  );
  ref.onDispose(client.close);
  return client;
});
