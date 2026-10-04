import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/data/apple_auth_client.dart';
import 'package:my_app/features/auth/data/auth_actions.dart';
import 'package:my_app/features/auth/data/google_auth_client.dart';
import 'package:my_app/features/auth/presentation/auth_providers.dart';
import 'package:my_app/features/auth/presentation/login_buttons.dart';
import 'package:my_app/features/auth/presentation/login_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FakeGoogleAuthClient implements GoogleAuthClient {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Widget _app({ThemeMode mode = ThemeMode.light}) {
  return ProviderScope(
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
    child: MaterialApp(
      themeMode: mode,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      home: const LoginPage(),
    ),
  );
}

bool _hasAsset(String name) => find.byWidgetPredicate(
      (w) => w is Image && w.image is AssetImage && (w.image as AssetImage).assetName == name,
    ).evaluate().isNotEmpty;

void main() {
  testWidgets('provider 버튼이 Kakao, Google, GitHub 순서로 표시되고 Apple은 없다', (tester) async {
    await tester.pumpWidget(_app());

    final labels = ['카카오 로그인', 'Google 계정으로 로그인', 'GitHub로 로그인'];
    for (final l in labels) {
      expect(find.text(l), findsOneWidget);
    }
    final ys = [for (final l in labels) tester.getTopLeft(find.text(l)).dy];
    expect(ys[0] < ys[1] && ys[1] < ys[2], isTrue);
    expect(find.text('Apple로 로그인'), findsNothing);
  });

  testWidgets('iOS 앱에서는 Apple 버튼이 맨 위에 높이 44로 표시된다', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.iOS;
    await tester.pumpWidget(_app());

    expect(find.text('Apple로 로그인'), findsOneWidget);
    expect(
      tester.getTopLeft(find.byType(AppleLoginButton)).dy < tester.getTopLeft(find.byType(KakaoLoginButton)).dy,
      isTrue,
    );
    expect(tester.getSize(find.byType(AppleLoginButton)).height, 44);
    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('Android에서는 Apple 버튼이 없다', (tester) async {
    debugDefaultTargetPlatformOverride = TargetPlatform.android;
    await tester.pumpWidget(_app());

    expect(find.text('Apple로 로그인'), findsNothing);
    debugDefaultTargetPlatformOverride = null;
  });

  testWidgets('3개 버튼의 높이가 모두 44다', (tester) async {
    await tester.pumpWidget(_app());

    for (final type in [KakaoLoginButton, GoogleLoginButton, GithubLoginButton]) {
      expect(tester.getSize(find.byType(type)).height, 44);
    }
  });

  testWidgets('브랜드 로고 에셋을 쓰고 Material 아이콘은 쓰지 않는다', (tester) async {
    await tester.pumpWidget(_app());

    expect(_hasAsset('assets/login/kakao_symbol.png'), isTrue);
    expect(_hasAsset('assets/login/google_g.png'), isTrue);
    expect(_hasAsset('assets/login/github_invertocat_white.png'), isTrue);
    expect(find.byIcon(Icons.chat_bubble), findsNothing);
  });

  testWidgets('다크 테마에서 렌더링되고 GitHub 로고가 black 에셋으로 바뀐다', (tester) async {
    await tester.pumpWidget(_app(mode: ThemeMode.dark));

    expect(tester.takeException(), isNull);
    expect(_hasAsset('assets/login/github_invertocat_black.png'), isTrue);
    expect(_hasAsset('assets/login/github_invertocat_white.png'), isFalse);
    expect(_hasAsset('assets/login/kakao_symbol.png'), isTrue);
  });
}
