// ignore_for_file: prefer_initializing_formals
// (공개 생성자 파라미터 이름을 private 필드 이름과 다르게 유지하기 위해 의도적으로 사용하지 않는다.)
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart' show GoogleSignInException, GoogleSignInExceptionCode;
import 'package:sign_in_with_apple/sign_in_with_apple.dart'
    show AuthorizationErrorCode, SignInWithAppleAuthorizationException;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/auth_exception.dart';
import 'apple_auth_client.dart';
import 'google_auth_client.dart';

/// Apple로 가입(또는 연결)한 회원인지. 이런 회원은 계정 삭제 때 Apple 토큰 철회가 필요하다.
bool isAppleUser(User? user) {
  final providers = user?.appMetadata['providers'];
  return providers is List && providers.contains('apple');
}

/// 로그인/로그아웃 동작. Google은 플랫폼별로 분기하고, Kakao·GitHub는 전 플랫폼 `signInWithOAuth`를 쓴다.
/// Apple은 iOS 앱 네이티브 로그인만 있다.
class AuthActions {
  AuthActions({
    required SupabaseClient client,
    required GoogleAuthClient googleAuthClient,
    required AppleAuthClient appleAuthClient,
    required String authRedirectUrl,
  }) : _client = client,
       _googleAuthClient = googleAuthClient,
       _appleAuthClient = appleAuthClient,
       _authRedirectUrl = authRedirectUrl;

  final SupabaseClient _client;
  final GoogleAuthClient _googleAuthClient;
  final AppleAuthClient _appleAuthClient;
  final String _authRedirectUrl;

  Future<void> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        await _client.auth.signInWithOAuth(OAuthProvider.google);
        return;
      }
      final idToken = await _googleAuthClient.signInAndGetIdToken();
      await _client.auth.signInWithIdToken(provider: OAuthProvider.google, idToken: idToken);
    } on GoogleSignInException catch (error) {
      if (error.code == GoogleSignInExceptionCode.canceled) {
        return;
      }
      throw const AuthActionException('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    } on AuthActionException {
      rethrow;
    } catch (_) {
      throw const AuthActionException('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  Future<void> signInWithApple() async {
    try {
      final credential = await _appleAuthClient.signInAndGetIdToken();
      await _client.auth.signInWithIdToken(
        provider: OAuthProvider.apple,
        idToken: credential.idToken,
        nonce: credential.rawNonce,
      );
      // Apple은 이름을 최초 로그인에서만 주고 ID 토큰에는 넣지 않는다. 받았을 때 바로 저장한다.
      final fullName = credential.fullName;
      if (fullName != null) {
        try {
          await _client.auth.updateUser(UserAttributes(data: {'full_name': fullName}));
        } catch (_) {}
      }
    } on SignInWithAppleAuthorizationException catch (error) {
      if (error.code == AuthorizationErrorCode.canceled) {
        return;
      }
      throw const AuthActionException('Apple 로그인에 실패했습니다. 다시 시도해주세요.');
    } on AuthActionException {
      rethrow;
    } catch (_) {
      throw const AuthActionException('Apple 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  Future<void> signInWithGithub() async {
    try {
      await _client.auth.signInWithOAuth(
        OAuthProvider.github,
        redirectTo: kIsWeb ? null : _authRedirectUrl,
      );
    } catch (_) {
      throw const AuthActionException('GitHub 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  Future<void> signInWithKakao() async {
    try {
      // Supabase는 카카오에 항상 account_email·profile_image·profile_nickname을 요청한다(scopes는 추가만 된다).
      // 세 동의항목이 카카오 콘솔에 모두 설정돼 있어야 KOE205가 나지 않는다(ADR-022).
      await _client.auth.signInWithOAuth(
        OAuthProvider.kakao,
        redirectTo: kIsWeb ? null : _authRedirectUrl,
      );
    } catch (_) {
      throw const AuthActionException('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }

  Future<void> signOut() async {
    try {
      await _client.auth.signOut();
    } catch (_) {
      throw const AuthActionException('로그아웃에 실패했습니다. 다시 시도해주세요.');
    }
  }

  /// 계정을 즉시 삭제한다. `delete-account` Edge Function이 요청 JWT의 사용자만 지운다.
  /// Apple 회원은 재인증으로 받은 authorizationCode를 함께 보내 서버가 Apple 토큰을 철회하게 한다.
  Future<void> deleteAccount() async {
    Map<String, dynamic>? body;
    if (isAppleUser(_client.auth.currentUser)) {
      try {
        body = {'appleAuthorizationCode': await _appleAuthClient.getAuthorizationCode()};
      } catch (_) {
        throw const AuthActionException('Apple 인증을 완료하지 못해 계정을 삭제하지 않았습니다.');
      }
    }
    try {
      await _client.functions.invoke('delete-account', body: body);
    } catch (_) {
      throw const AuthActionException('계정 삭제에 실패했습니다. 다시 시도해주세요.');
    }
    // 서버 계정은 이미 없으므로 기기에 남은 세션만 지운다.
    try {
      await _client.auth.signOut(scope: SignOutScope.local);
    } catch (_) {}
  }
}
