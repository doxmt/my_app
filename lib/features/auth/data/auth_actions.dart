// ignore_for_file: prefer_initializing_formals
// (공개 생성자 파라미터 이름을 private 필드 이름과 다르게 유지하기 위해 의도적으로 사용하지 않는다.)
import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;
import 'package:google_sign_in/google_sign_in.dart' show GoogleSignInException, GoogleSignInExceptionCode;
import 'package:sign_in_with_apple/sign_in_with_apple.dart'
    show AuthorizationErrorCode, SignInWithAppleAuthorizationException;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/auth_exception.dart';
import 'apple_auth_client.dart';
import 'google_auth_client.dart';

/// 로그인/로그아웃 동작. Google·Apple은 플랫폼별로 분기하고, Kakao·GitHub는 전 플랫폼 `signInWithOAuth`를 쓴다.
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
      if (!kIsWeb && defaultTargetPlatform == TargetPlatform.iOS) {
        final credential = await _appleAuthClient.signInAndGetIdToken();
        await _client.auth.signInWithIdToken(
          provider: OAuthProvider.apple,
          idToken: credential.idToken,
          nonce: credential.rawNonce,
        );
        return;
      }
      await _client.auth.signInWithOAuth(OAuthProvider.apple, redirectTo: kIsWeb ? null : _authRedirectUrl);
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
      // account_email은 Biz App 전용이라 이메일 없이 가입한다(ADR-018). 이메일 scope를 빼려면 scopes를 명시해야 한다.
      await _client.auth.signInWithOAuth(
        OAuthProvider.kakao,
        redirectTo: kIsWeb ? null : _authRedirectUrl,
        scopes: 'profile_nickname profile_image',
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
}
