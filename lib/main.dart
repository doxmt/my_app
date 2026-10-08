import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart' show closeInAppWebView;

import 'app/app_config.dart';
import 'app/router.dart';
import 'app/theme.dart';
import 'core/theme/theme_mode_provider.dart';
import 'features/auth/presentation/auth_providers.dart';

Future<void> main() async {
  usePathUrlStrategy();
  WidgetsFlutterBinding.ensureInitialized();

  final config = AppConfig.fromEnvironment();

  await Supabase.initialize(
    url: config.supabaseUrl,
    publishableKey: config.supabasePublishableKey,
  );

  final themeMode = await SharedPreferencesThemeModeStore(
    SharedPreferencesAsync(),
  ).read();

  runApp(
    ProviderScope(
      overrides: [initialThemeModeProvider.overrideWithValue(themeMode)],
      child: const MyApp(),
    ),
  );
}

final _messengerKey = GlobalKey<ScaffoldMessengerState>();

/// 로그인이 확인되면 카카오·깃허브 로그인이 남긴 인앱 브라우저 창을 닫고 알린다.
Future<void> _onSignedIn() async {
  if (!kIsWeb) {
    try {
      await closeInAppWebView();
    } catch (_) {}
  }
  _messengerKey.currentState
    ?..removeCurrentSnackBar()
    ..showSnackBar(
      const SnackBar(
        content: Center(child: Text('로그인에 성공했습니다.')),
        duration: Duration(seconds: 3),
      ),
    );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    ref.listen<AsyncValue<AuthState>>(authStateChangesProvider, (previous, next) {
      // 이미 로그인된 상태에서 다시 오는 signedIn(세션 복원 등)에는 알리지 않는다.
      if (next.value?.event == AuthChangeEvent.signedIn && previous?.value?.session == null) {
        _onSignedIn();
      }
    });

    return MaterialApp.router(
      title: '기술면접 준비',
      theme: buildLightTheme(),
      darkTheme: buildDarkTheme(),
      themeMode: ref.watch(themeModeProvider),
      scaffoldMessengerKey: _messengerKey,
      routerConfig: router,
    );
  }
}
