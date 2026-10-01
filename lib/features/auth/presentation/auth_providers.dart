import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/app_config.dart';
import '../../../core/storage/local_json_store.dart';
import '../../../core/supabase/supabase_client_provider.dart';
import '../../resume/data/local_resume_repository.dart';
import '../../wrong_notes/data/local_wrong_note_repository.dart';
import '../data/auth_actions.dart';
import '../data/google_auth_client.dart';
import '../data/local_data_migration_service.dart';
import '../data/migration_flag_store.dart';
import '../data/supabase_migration_gateway.dart';

final authStateChangesProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(supabaseClientProvider).auth.onAuthStateChange;
});

final googleSignInProvider = Provider<GoogleSignIn>((ref) => GoogleSignIn.instance);

final googleAuthClientProvider = Provider<GoogleAuthClient>((ref) {
  final config = ref.watch(appConfigProvider);
  return GoogleAuthClient(
    googleSignIn: ref.watch(googleSignInProvider),
    iosClientId: config.googleIosClientId,
    serverClientId: config.googleServerClientId,
  );
});


final authActionsProvider = Provider<AuthActions>((ref) {
  final config = ref.watch(appConfigProvider);
  return AuthActions(
    client: ref.watch(supabaseClientProvider),
    googleAuthClient: ref.watch(googleAuthClientProvider),
    authRedirectUrl: config.authRedirectUrl,
  );
});

final localDataMigrationServiceProvider = Provider<LocalDataMigrationService>((ref) {
  final jsonStore = ref.watch(localJsonStoreProvider);
  return LocalDataMigrationService(
    gateway: SupabaseMigrationGateway(ref.watch(supabaseClientProvider)),
    localWrongNoteRepository: LocalWrongNoteRepository(jsonStore),
    localResumeRepository: LocalResumeRepository(jsonStore),
    localJsonStore: jsonStore,
    flagStore: ref.watch(migrationFlagStoreProvider),
  );
});

/// 로그인한 회원의 user id. 로그인 직후 로컬 데이터 이전이 끝날 때까지는 null을 유지해
/// 오답노트·이력서 화면이 이전 완료 전에 Supabase 구현으로 전환되지 않게 한다.
///
/// `Session` 전체가 아니라 userId만 노출한다 — 세션은 토큰 갱신(약 1시간 주기)마다 새 객체로
/// 교체되는데, Session을 그대로 watch하면 그때마다 리포지토리 provider가 재생성돼 목록이 깜빡인다.
final currentUserIdProvider = NotifierProvider<CurrentUserIdNotifier, String?>(CurrentUserIdNotifier.new);

class CurrentUserIdNotifier extends Notifier<String?> {
  @override
  String? build() {
    ref.listen<AsyncValue<AuthState>>(authStateChangesProvider, (previous, next) {
      final change = next.value;
      if (change != null) {
        _handle(change);
      }
    });
    return null;
  }

  Future<void> _handle(AuthState change) async {
    final userId = change.session?.user.id;
    if (userId == null) {
      state = null;
      return;
    }

    final needsMigrationCheck =
        change.event == AuthChangeEvent.signedIn || change.event == AuthChangeEvent.initialSession;

    if (!needsMigrationCheck) {
      state = userId;
      return;
    }

    state = null;
    await ref.read(localDataMigrationServiceProvider).migrateIfNeeded(userId);
    state = userId;
  }
}
