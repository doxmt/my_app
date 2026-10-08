import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/supabase/supabase_client_provider.dart';
import '../../../core/theme/theme_mode_provider.dart';
import '../../auth/presentation/auth_providers.dart';
import 'account_actions.dart';

/// 내 정보 탭. 로그인 진입점(또는 계정 정보)과 이력서·오답노트 메뉴 항목을 보여준다.
class MePage extends ConsumerWidget {
  const MePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userId = ref.watch(currentUserIdProvider);
    final themeMode = ref.watch(themeModeProvider);
    final user = userId == null ? null : ref.watch(supabaseClientProvider).auth.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 정보'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: '설정',
            onPressed: () => context.push('/me/settings'),
          ),
        ],
      ),
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
                onPressed: () => confirmAndSignOut(context, ref),
                child: const Text('로그아웃'),
              ),
            )
          else
            ListTile(
              title: const Text('로그인'),
              subtitle: const Text('소셜 계정으로 로그인하고 데이터를 백업하세요'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/me/login'),
            ),
          ListTile(
            title: const Text('화면 모드'),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SegmentedButton<ThemeMode>(
                    showSelectedIcon: false,
                    segments: const [
                      ButtonSegment(
                        value: ThemeMode.light,
                        icon: Icon(Icons.light_mode_outlined),
                        label: Text('라이트'),
                      ),
                      ButtonSegment(
                        value: ThemeMode.dark,
                        icon: Icon(Icons.dark_mode_outlined),
                        label: Text('다크'),
                      ),
                    ],
                    selected: {themeMode},
                    onSelectionChanged: (selection) =>
                        ref.read(themeModeProvider.notifier).setMode(selection.first),
                  ),
                  const SizedBox(height: 8),
                  Text('기본은 라이트 모드입니다. 이 기기에 저장됩니다.', style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
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
          if (user != null)
            ListTile(
              title: Text('회원탈퇴', style: TextStyle(color: Theme.of(context).colorScheme.error)),
              onTap: () => confirmAndDeleteAccount(context, ref),
            ),
        ],
      ),
    );
  }
}
