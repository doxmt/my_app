import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// 전역 Supabase 클라이언트를 제공한다.
///
/// `main.dart`에서 `Supabase.initialize()`가 먼저 호출된 뒤에만 사용할 수 있다.
/// 테스트에서는 이 provider를 override해서 네트워크 호출 없이 동작하게 한다.
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});
