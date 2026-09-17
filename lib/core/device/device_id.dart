import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

/// 기기 ID를 읽고 쓰는 저장소 인터페이스.
///
/// 실제 구현은 [SharedPreferencesAsync]를 쓰고, 테스트는 in-memory fake를 주입한다.
abstract class DeviceIdStore {
  Future<String?> read();
  Future<void> write(String id);
}

const _deviceIdKey = 'device_id';

class SharedPreferencesDeviceIdStore implements DeviceIdStore {
  SharedPreferencesDeviceIdStore(this._prefs);

  final SharedPreferencesAsync _prefs;

  @override
  Future<String?> read() => _prefs.getString(_deviceIdKey);

  @override
  Future<void> write(String id) => _prefs.setString(_deviceIdKey, id);
}

final deviceIdStoreProvider = Provider<DeviceIdStore>((ref) {
  return SharedPreferencesDeviceIdStore(SharedPreferencesAsync());
});

/// 기기 ID. 최초 호출 때 UUID v4를 만들어 저장하고, 이후에는 저장된 값을 돌려준다.
final deviceIdProvider = FutureProvider<String>((ref) async {
  final store = ref.watch(deviceIdStoreProvider);
  final existing = await store.read();
  if (existing != null) {
    return existing;
  }
  final newId = const Uuid().v4();
  await store.write(newId);
  return newId;
});
