import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../../../core/legal/legal_links.dart';
import '../../auth/domain/auth_exception.dart';
import '../../auth/presentation/auth_providers.dart';

/// 앱 버전 문자열(`1.0.0 (1)`).
final appVersionProvider = FutureProvider<String>((ref) async {
  final info = await PackageInfo.fromPlatform();
  return '${info.version} (${info.buildNumber})';
});

/// 설정 화면. 방침·약관(외부 브라우저)과 앱 버전, 로그인 상태면 계정 삭제를 보여준다.
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
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('계정을 삭제할까요?'),
          content: const Text('계정과 계정에 저장된 오답노트·이력서·면접 기록이 바로 삭제되며 되돌릴 수 없습니다.'),
          actions: [
            TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('취소')),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              child: const Text('삭제'),
            ),
          ],
        ),
      );
      if (confirmed != true || !context.mounted) return;

      final messenger = ScaffoldMessenger.of(context);
      final navigator = Navigator.of(context);
      try {
        await ref.read(authActionsProvider).deleteAccount();
        messenger.showSnackBar(const SnackBar(content: Text('계정이 삭제되었습니다.')));
        navigator.pop();
      } on AuthActionException catch (error) {
        messenger.showSnackBar(SnackBar(content: Text(error.message)));
      }
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
              title: Text('계정 삭제', style: TextStyle(color: Theme.of(context).colorScheme.error)),
              onTap: deleteAccount,
            ),
        ],
      ),
    );
  }
}
