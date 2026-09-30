import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/theme/theme_mode_provider.dart';

class FakeThemeModeStore implements ThemeModeStore {
  FakeThemeModeStore([this.stored = ThemeMode.light]);

  ThemeMode stored;

  @override
  Future<ThemeMode> read() async => stored;

  @override
  Future<void> write(ThemeMode mode) async {
    stored = mode;
  }
}

void main() {
  test('저장된 값이 없으면 라이트가 기본이다', () {
    final container = ProviderContainer(overrides: [themeModeStoreProvider.overrideWithValue(FakeThemeModeStore())]);
    addTearDown(container.dispose);

    expect(container.read(themeModeProvider), ThemeMode.light);
  });

  test('시작 시 읽어 둔 값을 초기값으로 쓴다', () {
    final container = ProviderContainer(
      overrides: [
        themeModeStoreProvider.overrideWithValue(FakeThemeModeStore()),
        initialThemeModeProvider.overrideWithValue(ThemeMode.dark),
      ],
    );
    addTearDown(container.dispose);

    expect(container.read(themeModeProvider), ThemeMode.dark);
  });

  test('라이트/다크를 고르면 상태가 바뀌고 저장된다', () async {
    final store = FakeThemeModeStore();
    final container = ProviderContainer(overrides: [themeModeStoreProvider.overrideWithValue(store)]);
    addTearDown(container.dispose);
    final notifier = container.read(themeModeProvider.notifier);

    await notifier.setMode(ThemeMode.dark);
    expect(container.read(themeModeProvider), ThemeMode.dark);
    expect(store.stored, ThemeMode.dark);

    await notifier.setMode(ThemeMode.light);
    expect(container.read(themeModeProvider), ThemeMode.light);
    expect(store.stored, ThemeMode.light);
  });
}
