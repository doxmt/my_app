import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/device/device_id.dart';

/// in-memory fake. `setMockInitialValues`는 새 shared_preferences API에서
/// 지원하지 않으므로 쓰지 않는다.
class FakeDeviceIdStore implements DeviceIdStore {
  String? _value;

  @override
  Future<String?> read() async => _value;

  @override
  Future<void> write(String id) async => _value = id;
}

void main() {
  test('첫 호출에서 UUID v4를 만들어 저장한다', () async {
    final store = FakeDeviceIdStore();
    final container = ProviderContainer(
      overrides: [deviceIdStoreProvider.overrideWithValue(store)],
    );
    addTearDown(container.dispose);

    final id = await container.read(deviceIdProvider.future);

    final uuidV4Pattern = RegExp(
      r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      caseSensitive: false,
    );
    expect(uuidV4Pattern.hasMatch(id), isTrue);
    expect(await store.read(), id);
  });

  test('두 번째 호출은 첫 번째와 같은 값을 돌려준다', () async {
    final store = FakeDeviceIdStore();
    final container = ProviderContainer(
      overrides: [deviceIdStoreProvider.overrideWithValue(store)],
    );
    addTearDown(container.dispose);

    final first = await container.read(deviceIdProvider.future);
    container.invalidate(deviceIdProvider);
    final second = await container.read(deviceIdProvider.future);

    expect(second, first);
  });
}
