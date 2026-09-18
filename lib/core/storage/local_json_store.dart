import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 키 하나에 JSON(맵) 값 하나를 읽고 쓰는 로컬 저장소 인터페이스.
///
/// 실제 구현은 [SharedPreferencesAsync]를 쓰고, 테스트는 in-memory fake를 주입한다.
abstract class LocalJsonStore {
  Future<Map<String, dynamic>?> read(String key);
  Future<void> write(String key, Map<String, dynamic> value);
}

class SharedPreferencesJsonStore implements LocalJsonStore {
  SharedPreferencesJsonStore(this._prefs);

  final SharedPreferencesAsync _prefs;

  @override
  Future<Map<String, dynamic>?> read(String key) async {
    final raw = await _prefs.getString(key);
    if (raw == null) {
      return null;
    }
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  @override
  Future<void> write(String key, Map<String, dynamic> value) {
    return _prefs.setString(key, jsonEncode(value));
  }
}

final localJsonStoreProvider = Provider<LocalJsonStore>((ref) {
  return SharedPreferencesJsonStore(SharedPreferencesAsync());
});
