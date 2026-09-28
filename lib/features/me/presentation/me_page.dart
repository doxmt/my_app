import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/supabase/supabase_client_provider.dart';
import '../../auth/presentation/auth_providers.dart';

/// 내 정보 탭. 로그인 진입점(또는 계정 정보)과 이력서·오답노트 메뉴 항목을 보여준다.
class MePage extends ConsumerWidget {
  const MePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(currentUserIdProvider);
    final user = userId == null ? null : ref.watch(supabaseClientProvider).auth.currentUser;

    return Scaffold(
      appBar: AppBar(title: const Text('내 정보')),
      body: ListView(
        children: [
          if (user != null)
            ListTile(
              leading: const Icon(Icons.account_circle),
              title: Text(
                (user.userMetadata?['full_name'] ??
                        user.userMetadata?['name'] ??
                        user.userMetadata?['nickname'] ??
                        user.email ??
                        '회원')
                    .toString(),
              ),
              subtitle: user.email == null ? null : Text(user.email!),
              trailing: TextButton(
                onPressed: () => ref.read(authActionsProvider).signOut(),
                child: const Text('로그아웃'),
              ),
            )
          else
            ListTile(
              title: const Text('로그인'),
              subtitle: const Text('Google 또는 GitHub로 로그인하고 데이터를 백업하세요'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/me/login'),
            ),
          ListTile(
            title: const Text('이력서'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/me/resume'),
          ),
          ListTile(
            title: const Text('오답노트'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.go('/me/wrong-notes'),
          ),
        ],
      ),
    );
  }
}
