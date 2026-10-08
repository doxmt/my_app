import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;
import 'package:flutter/gestures.dart' show TapGestureRecognizer;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/legal/legal_links.dart';
import '../domain/auth_exception.dart';
import 'auth_providers.dart';
import 'login_buttons.dart';

/// 로그인 화면. provider별 로그인 버튼을 보여주고, 취소·실패 시 에러 메시지를 보여준다.
class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _signIn(Future<void> Function() action) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      await action();
      if (mounted && context.canPop()) {
        context.pop();
      }
    } on AuthActionException catch (error) {
      if (mounted) {
        setState(() => _errorMessage = error.message);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final actions = ref.read(authActionsProvider);
    // Apple 로그인은 iOS 앱에서만 제공한다(가이드라인 4.8). 웹·Android에는 버튼을 두지 않는다.
    final showApple = !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    return Scaffold(
      appBar: AppBar(title: const Text('로그인')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 360),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  '소셜 계정으로 로그인하면\n기기에 저장된 오답노트와 이력서가 계정으로 이동합니다.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                if (showApple) ...[
                  AppleLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithApple)),
                  const SizedBox(height: 12),
                ],
                KakaoLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithKakao)),
                const SizedBox(height: 12),
                GoogleLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithGoogle)),
                const SizedBox(height: 12),
                GithubLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithGithub)),
                const SizedBox(height: 20),
                const _ConsentNotice(),
                if (_isLoading) ...[const SizedBox(height: 16), const Center(child: CircularProgressIndicator())],
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _errorMessage!,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 로그인 버튼 아래 동의 고지. 이용약관·개인정보처리방침은 문구 안의 밑줄 링크로 연다(웹 로그인 화면과 같은 방식).
class _ConsentNotice extends ConsumerStatefulWidget {
  const _ConsentNotice();

  @override
  ConsumerState<_ConsentNotice> createState() => _ConsentNoticeState();
}

class _ConsentNoticeState extends ConsumerState<_ConsentNotice> {
  late final TapGestureRecognizer _termsTap;
  late final TapGestureRecognizer _privacyTap;

  @override
  void initState() {
    super.initState();
    _termsTap = TapGestureRecognizer()..onTap = () => _open((urls) => urls.terms);
    _privacyTap = TapGestureRecognizer()..onTap = () => _open((urls) => urls.privacy);
  }

  @override
  void dispose() {
    _termsTap.dispose();
    _privacyTap.dispose();
    super.dispose();
  }

  void _open(Uri Function(LegalUrls) pick) {
    ref.read(externalUrlOpenerProvider)(pick(ref.read(legalUrlsProvider)));
  }

  @override
  Widget build(BuildContext context) {
    final base = Theme.of(context).textTheme.bodySmall?.copyWith(
      color: Theme.of(context).colorScheme.onSurfaceVariant,
      height: 1.6,
    );
    final link = base?.copyWith(
      decoration: TextDecoration.underline,
      color: Theme.of(context).colorScheme.onSurface,
    );
    return Text.rich(
      TextSpan(
        style: base,
        children: [
          const TextSpan(text: '로그인하면 '),
          TextSpan(text: '이용약관', style: link, recognizer: _termsTap),
          const TextSpan(text: '·'),
          TextSpan(text: '개인정보처리방침', style: link, recognizer: _privacyTap),
          const TextSpan(text: '에\n동의한 것으로 봅니다.'),
        ],
      ),
      textAlign: TextAlign.center,
    );
  }
}
