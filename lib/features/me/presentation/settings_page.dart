import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/legal/legal_links.dart';
import '../../auth/presentation/auth_providers.dart';
import 'account_actions.dart';

/// 앱 버전 문자열(`1.0.0 (1)`).
final appVersionProvider = FutureProvider<String>((ref) async {
  final info = await PackageInfo.fromPlatform();
  return '${info.version} (${info.buildNumber})';
});

/// 설정 화면. 방침·약관(외부 브라우저)과 앱 버전, 로그인 상태면 회원탈퇴를 보여준다.
class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final version = ref.watch(appVersionProvider);
    final isMember = ref.watch(currentUserIdProvider) != null;

    void open(Uri Function(LegalUrls) pick) {
      ref.read(externalUrlOpenerProvider)(pick(ref.read(legalUrlsProvider)));
    }

    Future<void> deleteAccount() async {
      final deleted = await confirmAndDeleteAccount(context, ref);
      if (deleted && context.mounted) Navigator.of(context).pop();
    }

    return Scaffold(
      appBar: AppBar(title: const Text('설정')),
      body: ListView(
        children: [
          ListTile(
            title: const Text('개인정보처리방침'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => open((urls) => urls.privacy),
          ),
          ListTile(
            title: const Text('이용약관'),
            trailing: const Icon(Icons.open_in_new),
            onTap: () => open((urls) => urls.terms),
          ),
          ListTile(
            title: const Text('앱 버전'),
            trailing: Text(version.value ?? ''),
          ),
          if (isMember)
            ListTile(
              title: Text('회원탈퇴', style: TextStyle(color: Theme.of(context).colorScheme.error)),
              onTap: deleteAccount,
            ),
        ],
      ),
    );
  }
}
