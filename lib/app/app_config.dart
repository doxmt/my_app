/// 앱 실행에 필요한 환경 설정 값.
///
/// 로컬 개발은 `--dart-define-from-file=env/dev.json`,
/// Vercel 웹 배포는 `--dart-define`으로 값을 주입한다.
/// CI(`flutter test`)는 Supabase를 초기화하지 않으므로 값이 필요 없다.
class AppConfig {
  const AppConfig({required this.supabaseUrl, required this.supabasePublishableKey});

  final String supabaseUrl;
  final String supabasePublishableKey;

  /// 컴파일 타임 환경 변수에서 설정 값을 읽는다.
  ///
  /// `SUPABASE_URL` 또는 `SUPABASE_PUBLISHABLE_KEY`가 비어 있으면
  /// 어떤 값이 빠졌는지 알려주는 [StateError]를 던진다.
  factory AppConfig.fromEnvironment() {
    const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
    const supabasePublishableKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

    final missing = <String>[
      if (supabaseUrl.isEmpty) 'SUPABASE_URL',
      if (supabasePublishableKey.isEmpty) 'SUPABASE_PUBLISHABLE_KEY',
    ];

    if (missing.isNotEmpty) {
      throw StateError(
        '다음 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}. '
        '--dart-define-from-file=env/dev.json으로 실행하세요.',
      );
    }

    return const AppConfig(
      supabaseUrl: supabaseUrl,
      supabasePublishableKey: supabasePublishableKey,
    );
  }
}
