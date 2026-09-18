// ignore_for_file: prefer_initializing_formals
// (공개 생성자 파라미터 이름을 private 필드 이름과 다르게 유지하기 위해 의도적으로 사용하지 않는다.)
import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';

import '../domain/auth_exception.dart';

/// `google_sign_in` 7.x 네이티브 로그인 (Android/iOS 전용). Web은 `signInWithOAuth` 리다이렉트를 쓴다.
class GoogleAuthClient {
  GoogleAuthClient({
    required GoogleSignIn googleSignIn,
    required String iosClientId,
    required String serverClientId,
  }) : _googleSignIn = googleSignIn,
       _iosClientId = iosClientId,
       _serverClientId = serverClientId;

  final GoogleSignIn _googleSignIn;
  final String _iosClientId;
  final String _serverClientId;
  bool _initialized = false;

  Future<void> _ensureInitialized() async {
    if (_initialized) {
      return;
    }
    final isIOS = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    await _googleSignIn.initialize(
      clientId: isIOS ? _iosClientId : null,
      serverClientId: _serverClientId,
    );
    _initialized = true;
  }

  /// Google 인증 후 ID 토큰을 반환한다. 취소·실패 시 [AuthActionException]을 던진다.
  Future<String> signInAndGetIdToken() async {
    await _ensureInitialized();
    final account = await _googleSignIn.authenticate();
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw const AuthActionException('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    }
    return idToken;
  }
}
