import 'package:flutter_riverpod/flutter_riverpod.dart';

/// 앱 실행에 필요한 환경 설정 값.
///
/// 로컬 개발은 `--dart-define-from-file=env/dev.json`,
/// Vercel 웹 배포는 `--dart-define`으로 값을 주입한다.
/// CI(`flutter test`)는 Supabase를 초기화하지 않으므로 값이 필요 없다.
class AppConfig {
  const AppConfig({
    required this.supabaseUrl,
    required this.supabasePublishableKey,
    required this.pdfParseBaseUrl,
    required this.googleIosClientId,
    required this.googleServerClientId,
    required this.authRedirectUrl,
  });

  final String supabaseUrl;
  final String supabasePublishableKey;

  /// PDF 텍스트 추출 Vercel 함수가 배포된 오리진 (예: `https://my-app.vercel.app`).
  final String pdfParseBaseUrl;

  /// Google Cloud Console의 iOS OAuth 클라이언트 ID. `google_sign_in` 네이티브 로그인(Android/iOS)에 쓴다.
  final String googleIosClientId;

  /// Google Cloud Console의 Web OAuth 클라이언트 ID(serverClientId). ID 토큰 발급에 필요하다.
  final String googleServerClientId;

  /// 네이티브(Android/iOS) `signInWithOAuth` 딥링크 콜백 URL. Web에서는 쓰지 않는다.
  final String authRedirectUrl;

  /// 컴파일 타임 환경 변수에서 설정 값을 읽는다.
  ///
  /// 필요한 값 중 하나라도 비어 있으면 어떤 값이 빠졌는지 알려주는 [StateError]를 던진다.
  /// Google/GitHub OAuth 설정 값은 아직 외부 콘솔 등록이 끝나지 않아도 앱이 뜰 수 있도록 선택값으로 둔다.
  factory AppConfig.fromEnvironment() {
    const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
    const supabasePublishableKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');
    const pdfParseBaseUrl = String.fromEnvironment('PDF_PARSE_BASE_URL');
    const googleIosClientId = String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');
    const googleServerClientId = String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');
    const authRedirectUrl = String.fromEnvironment('AUTH_REDIRECT_URL');

    final missing = <String>[
      if (supabaseUrl.isEmpty) 'SUPABASE_URL',
      if (supabasePublishableKey.isEmpty) 'SUPABASE_PUBLISHABLE_KEY',
      if (pdfParseBaseUrl.isEmpty) 'PDF_PARSE_BASE_URL',
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
      pdfParseBaseUrl: pdfParseBaseUrl,
      googleIosClientId: googleIosClientId,
      googleServerClientId: googleServerClientId,
      authRedirectUrl: authRedirectUrl,
    );
  }
}

final appConfigProvider = Provider<AppConfig>((ref) => AppConfig.fromEnvironment());
