import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// 모의면접 데이터의 OpenAI(미국) 전송 동의 저장소. 기기에만 저장한다.
///
/// 실제 구현은 [SharedPreferencesAsync]를 쓰고, 테스트는 in-memory fake를 주입한다.
abstract class OpenAiConsentStore {
  Future<bool> read();
  Future<void> write();
}

const _openAiConsentKey = 'openai_consent';

/// 동의 문구가 바뀌어 다시 받아야 할 때 올린다.
const _consentVersion = 1;

class SharedPreferencesOpenAiConsentStore implements OpenAiConsentStore {
  SharedPreferencesOpenAiConsentStore(this._prefs);

  final SharedPreferencesAsync _prefs;

  @override
  Future<bool> read() async {
    final raw = await _prefs.getString(_openAiConsentKey);
    if (raw == null) return false;
    try {
      final json = jsonDecode(raw);
      return json is Map && json['version'] == _consentVersion;
    } on FormatException {
      return false;
    }
  }

  @override
  Future<void> write() {
    return _prefs.setString(
      _openAiConsentKey,
      jsonEncode({
        'version': _consentVersion,
        'consentedAt': DateTime.now().toUtc().toIso8601String(),
      }),
    );
  }
}

final openAiConsentStoreProvider = Provider<OpenAiConsentStore>((ref) {
  return SharedPreferencesOpenAiConsentStore(SharedPreferencesAsync());
});

class OpenAiConsentNotifier extends AsyncNotifier<bool> {
  @override
  Future<bool> build() => ref.read(openAiConsentStoreProvider).read();

  Future<void> grant() async {
    await ref.read(openAiConsentStoreProvider).write();
    state = const AsyncData(true);
  }
}

final openAiConsentProvider =
    AsyncNotifierProvider<OpenAiConsentNotifier, bool>(
      OpenAiConsentNotifier.new,
    );
