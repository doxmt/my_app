import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/auth_exception.dart';

/// nonce 원문의 SHA-256 hex 다이제스트. Apple에는 이 해시를, Supabase에는 원문을 넘긴다.
String hashNonce(String rawNonce) => sha256.convert(utf8.encode(rawNonce)).toString();

/// `sign_in_with_apple` iOS 네이티브 로그인. Web/Android는 `signInWithOAuth` 리다이렉트를 쓴다.
class AppleAuthClient {
  /// Apple 인증 후 ID 토큰과 nonce 원문을 반환한다.
  /// 사용자가 취소하면 [SignInWithAppleAuthorizationException]이, 토큰이 없으면 [AuthActionException]이 던져진다.
  Future<({String idToken, String rawNonce})> signInAndGetIdToken() async {
    final rawNonce = Supabase.instance.client.auth.generateRawNonce();
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
      nonce: hashNonce(rawNonce),
    );
    final idToken = credential.identityToken;
    if (idToken == null) {
      throw const AuthActionException('Apple 로그인에 실패했습니다. 다시 시도해주세요.');
    }
    return (idToken: idToken, rawNonce: rawNonce);
  }
}
