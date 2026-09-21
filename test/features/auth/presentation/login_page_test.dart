import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/data/apple_auth_client.dart';
import 'package:my_app/features/auth/data/auth_actions.dart';
import 'package:my_app/features/auth/data/google_auth_client.dart';
import 'package:my_app/features/auth/presentation/auth_providers.dart';
import 'package:my_app/features/auth/presentation/login_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FakeGoogleAuthClient implements GoogleAuthClient {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('provider 버튼이 Google, Apple, Kakao, GitHub 순서로 표시된다', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authActionsProvider.overrideWithValue(
            AuthActions(
              client: SupabaseClient(
                'https://example.supabase.co',
                'publishable-key',
                authOptions: const AuthClientOptions(autoRefreshToken: false),
              ),
              googleAuthClient: FakeGoogleAuthClient(),
              appleAuthClient: AppleAuthClient(),
              authRedirectUrl: 'app://login-callback',
            ),
          ),
        ],
        child: const MaterialApp(home: LoginPage()),
      ),
    );

    expect(find.text('Apple로 계속하기'), findsOneWidget);
    expect(find.byIcon(Icons.apple), findsOneWidget);
    expect(find.byIcon(Icons.chat_bubble), findsOneWidget);
    final google = tester.getTopLeft(find.text('Google로 계속하기')).dy;
    final apple = tester.getTopLeft(find.text('Apple로 계속하기')).dy;
    final kakao = tester.getTopLeft(find.text('카카오로 계속하기')).dy;
    final github = tester.getTopLeft(find.text('GitHub로 계속하기')).dy;
    expect(google < apple && apple < kakao && kakao < github, isTrue);
  });
}
