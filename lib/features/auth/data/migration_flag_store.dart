import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 계정별로 로컬→서버 데이터 이전이 끝났는지 기록한다.
/// `onAuthStateChange`는 앱 재시작 복원·토큰 갱신에도 발화하므로, 매번 전체 업로드가 돌지 않도록 막는다.
abstract class MigrationFlagStore {
  Future<bool> isMigrated(String userId);
  Future<void> markMigrated(String userId);
}

class SharedPreferencesMigrationFlagStore implements MigrationFlagStore {
  SharedPreferencesMigrationFlagStore(this._prefs);

  final SharedPreferencesAsync _prefs;

  String _key(String userId) => 'local_data_migrated_$userId';

  @override
  Future<bool> isMigrated(String userId) async {
    return await _prefs.getBool(_key(userId)) ?? false;
  }

  @override
  Future<void> markMigrated(String userId) {
    return _prefs.setBool(_key(userId), true);
  }
}

final migrationFlagStoreProvider = Provider<MigrationFlagStore>((ref) {
  return SharedPreferencesMigrationFlagStore(SharedPreferencesAsync());
});
