import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/consent/openai_consent_provider.dart';

class FakeOpenAiConsentStore implements OpenAiConsentStore {
  FakeOpenAiConsentStore({this.consented = false});

  bool consented;

  @override
  Future<bool> read() async => consented;

  @override
  Future<void> write() async {
    consented = true;
  }
}

void main() {
  test('저장된 동의가 없으면 미동의다', () async {
    final container = ProviderContainer(
      overrides: [
        openAiConsentStoreProvider.overrideWithValue(FakeOpenAiConsentStore()),
      ],
    );
    addTearDown(container.dispose);

    expect(await container.read(openAiConsentProvider.future), isFalse);
  });

  test('동의하면 저장되고 상태가 바뀐다', () async {
    final store = FakeOpenAiConsentStore();
    final container = ProviderContainer(
      overrides: [openAiConsentStoreProvider.overrideWithValue(store)],
    );
    addTearDown(container.dispose);

    await container.read(openAiConsentProvider.future);
    await container.read(openAiConsentProvider.notifier).grant();

    expect(container.read(openAiConsentProvider).value, isTrue);
    expect(store.consented, isTrue);
  });

  test('이미 동의한 기기는 다시 읽어도 동의 상태다', () async {
    final container = ProviderContainer(
      overrides: [
        openAiConsentStoreProvider.overrideWithValue(
          FakeOpenAiConsentStore(consented: true),
        ),
      ],
    );
    addTearDown(container.dispose);

    expect(await container.read(openAiConsentProvider.future), isTrue);
  });
}
