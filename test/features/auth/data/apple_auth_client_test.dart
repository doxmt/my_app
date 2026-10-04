import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/data/apple_auth_client.dart';
import 'package:my_app/features/auth/data/auth_actions.dart';
import 'package:my_app/features/auth/data/google_auth_client.dart';
import 'package:my_app/features/auth/domain/auth_exception.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FakeAppleAuthClient implements AppleAuthClient {
  FakeAppleAuthClient(this._error);

  final Object _error;

  @override
  Future<({String idToken, String rawNonce, String? fullName})> signInAndGetIdToken() async => throw _error;
}

class FakeGoogleAuthClient implements GoogleAuthClient {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

AuthActions _actions(Object appleError) => AuthActions(
  client: SupabaseClient(
    'https://example.supabase.co',
    'publishable-key',
    authOptions: const AuthClientOptions(autoRefreshToken: false),
  ),
  googleAuthClient: FakeGoogleAuthClient(),
  appleAuthClient: FakeAppleAuthClient(appleError),
  authRedirectUrl: 'app://login-callback',
);

void main() {
  test('hashNonce는 SHA-256 hex 다이제스트를 반환한다', () {
    expect(hashNonce('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  group('appleDisplayName', () {
    test('한글 이름은 성과 이름을 붙인다', () {
      expect(appleDisplayName('길동', '홍'), '홍길동');
    });

    test('그 외 이름은 이름 성 순서로 띄어 쓴다', () {
      expect(appleDisplayName('Jane', 'Doe'), 'Jane Doe');
      expect(appleDisplayName('Jane', null), 'Jane');
    });

    test('이름이 오지 않으면(두 번째 로그인부터) null이다', () {
      expect(appleDisplayName(null, null), isNull);
      expect(appleDisplayName(' ', ''), isNull);
    });
  });

  group('AuthActions.signInWithApple', () {
    test('사용자가 취소하면 예외 없이 반환한다', () async {
      final actions = _actions(
        const SignInWithAppleAuthorizationException(code: AuthorizationErrorCode.canceled, message: 'canceled'),
      );
      await actions.signInWithApple();
    });

    test('그 외 Apple 오류는 AuthActionException으로 변환한다', () async {
      final actions = _actions(
        const SignInWithAppleAuthorizationException(code: AuthorizationErrorCode.failed, message: 'failed'),
      );
      expect(actions.signInWithApple(), throwsA(isA<AuthActionException>()));
    });

    test('identityToken이 없다는 AuthActionException은 그대로 전달한다', () async {
      final actions = _actions(const AuthActionException('Apple 로그인에 실패했습니다. 다시 시도해주세요.'));
      expect(actions.signInWithApple(), throwsA(isA<AuthActionException>()));
    });
  });
}
