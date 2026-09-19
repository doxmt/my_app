import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/storage/local_json_store.dart';
import 'package:my_app/core/supabase/supabase_client_provider.dart';
import 'package:my_app/features/auth/presentation/auth_providers.dart';
import 'package:my_app/features/wrong_notes/data/local_wrong_note_repository.dart';
import 'package:my_app/features/wrong_notes/data/supabase_wrong_note_repository.dart';
import 'package:my_app/features/wrong_notes/presentation/wrong_notes_providers.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase 서버를 실제로 부르지 않는다 — 생성만으로 쿼리가 나가지 않는 클라이언트다.
final _fakeSupabaseClient = SupabaseClient('https://example.supabase.co', 'test-anon-key');

class _FakeLocalJsonStore implements LocalJsonStore {
  @override
  Future<Map<String, dynamic>?> read(String key) async => null;

  @override
  Future<void> write(String key, Map<String, dynamic> value) async {}
}

void main() {
  test('로그인하지 않았으면 LocalWrongNoteRepository를 고른다', () {
    final container = ProviderContainer(
      overrides: [
        currentUserIdProvider.overrideWith(() => _FixedCurrentUserId(null)),
        supabaseClientProvider.overrideWithValue(_fakeSupabaseClient),
        localJsonStoreProvider.overrideWithValue(_FakeLocalJsonStore()),
      ],
    );
    addTearDown(container.dispose);

    final repository = container.read(wrongNoteRepositoryProvider);

    expect(repository, isA<LocalWrongNoteRepository>());
  });

  test('로그인했으면 SupabaseWrongNoteRepository를 고른다', () {
    final container = ProviderContainer(
      overrides: [
        currentUserIdProvider.overrideWith(() => _FixedCurrentUserId('user-1')),
        supabaseClientProvider.overrideWithValue(_fakeSupabaseClient),
      ],
    );
    addTearDown(container.dispose);

    final repository = container.read(wrongNoteRepositoryProvider);

    expect(repository, isA<SupabaseWrongNoteRepository>());
  });
}

class _FixedCurrentUserId extends CurrentUserIdNotifier {
  _FixedCurrentUserId(this._value);

  final String? _value;

  @override
  String? build() => _value;
}
