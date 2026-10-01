import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
                KakaoLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithKakao)),
                const SizedBox(height: 12),
                GoogleLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithGoogle)),
                const SizedBox(height: 12),
                GithubLoginButton(enabled: !_isLoading, onPressed: () => _signIn(actions.signInWithGithub)),
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
