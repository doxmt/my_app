import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../domain/auth_exception.dart';
import 'auth_providers.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final appleStyle = OutlinedButton.styleFrom(
      backgroundColor: isDark ? Colors.white : Colors.black,
      foregroundColor: isDark ? Colors.black : Colors.white,
    );
    final kakaoStyle = OutlinedButton.styleFrom(
      backgroundColor: const Color(0xFFFEE500),
      foregroundColor: const Color(0xD9000000),
    );
    final providers = <({String label, Future<void> Function() action, Widget? icon, ButtonStyle? style})>[
      (label: 'Google로 계속하기', action: actions.signInWithGoogle, icon: null, style: null),
      (label: 'Apple로 계속하기', action: actions.signInWithApple, icon: const Icon(Icons.apple), style: appleStyle),
      (label: '카카오로 계속하기', action: actions.signInWithKakao, icon: const Icon(Icons.chat_bubble), style: kakaoStyle),
      (label: 'GitHub로 계속하기', action: actions.signInWithGithub, icon: null, style: null),
    ];

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
                const Text(
                  '소셜 계정으로 로그인하면\n기기에 저장된 오답노트와 이력서가 계정으로 이동합니다.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                for (final (index, provider) in providers.indexed) ...[
                  if (index > 0) const SizedBox(height: 12),
                  index == 0
                      ? ElevatedButton.icon(
                          onPressed: _isLoading ? null : () => _signIn(provider.action),
                          style: provider.style,
                          icon: provider.icon,
                          label: Text(provider.label),
                        )
                      : OutlinedButton.icon(
                          onPressed: _isLoading ? null : () => _signIn(provider.action),
                          style: provider.style,
                          icon: provider.icon,
                          label: Text(provider.label),
                        ),
                ],
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
