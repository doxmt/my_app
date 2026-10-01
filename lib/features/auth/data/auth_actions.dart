// ignore_for_file: prefer_initializing_formals
// (공개 생성자 파라미터 이름을 private 필드 이름과 다르게 유지하기 위해 의도적으로 사용하지 않는다.)
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart' show GoogleSignInException, GoogleSignInExceptionCode;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/auth_exception.dart';
import 'google_auth_client.dart';

/// 로그인/로그아웃 동작. Google은 플랫폼별로 분기하고, Kakao·GitHub는 전 플랫폼 `signInWithOAuth`를 쓴다.
class AuthActions {
  AuthActions({
    required SupabaseClient client,
    required GoogleAuthClient googleAuthClient,
    required String authRedirectUrl,
  }) : _client = client,
       _googleAuthClient = googleAuthClient,
       _authRedirectUrl = authRedirectUrl;

  final SupabaseClient _client;
  final GoogleAuthClient _googleAuthClient;
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
}
