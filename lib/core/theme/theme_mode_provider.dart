import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 화면 모드(라이트/다크) 저장소. 저장값이 없으면 라이트가 기본이다(기기 설정은 따르지 않는다).
///
/// 실제 구현은 [SharedPreferencesAsync]를 쓰고, 테스트는 in-memory fake를 주입한다.
abstract class ThemeModeStore {
  Future<ThemeMode> read();
  Future<void> write(ThemeMode mode);
}

const _themeModeKey = 'theme_mode';

class SharedPreferencesThemeModeStore implements ThemeModeStore {
  SharedPreferencesThemeModeStore(this._prefs);

  final SharedPreferencesAsync _prefs;

  @override
  Future<ThemeMode> read() async {
    return switch (await _prefs.getString(_themeModeKey)) {
      'dark' => ThemeMode.dark,
      _ => ThemeMode.light,
    };
  }

  @override
  Future<void> write(ThemeMode mode) {
    return _prefs.setString(_themeModeKey, mode == ThemeMode.dark ? 'dark' : 'light');
  }
}

final themeModeStoreProvider = Provider<ThemeModeStore>((ref) {
  return SharedPreferencesThemeModeStore(SharedPreferencesAsync());
});

/// 앱 시작 시 저장된 값을 미리 읽어 넣는다(`main`에서 override). 읽기 전 첫 프레임의 깜빡임을 막는다.
final initialThemeModeProvider = Provider<ThemeMode>((ref) => ThemeMode.light);

class ThemeModeNotifier extends Notifier<ThemeMode> {
  @override
  ThemeMode build() => ref.watch(initialThemeModeProvider);

  Future<void> setMode(ThemeMode mode) async {
    state = mode;
    await ref.read(themeModeStoreProvider).write(mode);
  }
}

final themeModeProvider = NotifierProvider<ThemeModeNotifier, ThemeMode>(
  ThemeModeNotifier.new,
);
