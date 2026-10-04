import 'dart:convert';

import 'package:crypto/crypto.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/auth_exception.dart';

/// nonce 원문의 SHA-256 hex 다이제스트. Apple에는 이 해시를, Supabase에는 원문을 넘긴다.
String hashNonce(String rawNonce) => sha256.convert(utf8.encode(rawNonce)).toString();

/// Apple이 준 이름 조각으로 표시명을 만든다. 한글 이름은 "성이름", 그 외는 "이름 성". 둘 다 없으면 null.
String? appleDisplayName(String? givenName, String? familyName) {
  final given = givenName?.trim() ?? '';
  final family = familyName?.trim() ?? '';
  if (given.isEmpty && family.isEmpty) {
    return null;
  }
  final isHangul = RegExp(r'[가-힣]').hasMatch('$family$given');
  return isHangul ? '$family$given' : '$given $family'.trim();
}

/// `sign_in_with_apple` iOS 네이티브 로그인. Apple 로그인은 iOS 앱에서만 제공한다.
class AppleAuthClient {
  /// Apple 인증 후 ID 토큰과 nonce 원문, (최초 로그인에서만 오는) 이름을 반환한다.
  /// 사용자가 취소하면 [SignInWithAppleAuthorizationException]이, 토큰이 없으면 [AuthActionException]이 던져진다.
  Future<({String idToken, String rawNonce, String? fullName})> signInAndGetIdToken() async {
    final rawNonce = Supabase.instance.client.auth.generateRawNonce();
    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [AppleIDAuthorizationScopes.email, AppleIDAuthorizationScopes.fullName],
      nonce: hashNonce(rawNonce),
    );
    final idToken = credential.identityToken;
    if (idToken == null) {
      throw const AuthActionException('Apple 로그인에 실패했습니다. 다시 시도해주세요.');
    }
    return (
      idToken: idToken,
      rawNonce: rawNonce,
      fullName: appleDisplayName(credential.givenName, credential.familyName),
    );
  }
}
