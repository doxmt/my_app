import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/domain/auth_exception.dart';
import '../../auth/presentation/auth_providers.dart';

/// 앱 디자인에 맞춘 확인 팝업. 가운데 정렬 제목·안내 아래에 [취소]와 확인 버튼을 나란히 둔다.
Future<bool> _confirm(
  BuildContext context, {
  required String title,
  String? message,
  required String confirmLabel,
  bool destructive = false,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) {
      final theme = Theme.of(context);
      final scheme = theme.colorScheme;
      return Dialog(
        backgroundColor: scheme.surface,
        surfaceTintColor: Colors.transparent,
        insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              ),
              if (message != null) ...[
                const SizedBox(height: 12),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(color: scheme.onSurfaceVariant, height: 1.5),
                ),
              ],
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
                      child: const Text('취소'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      style: FilledButton.styleFrom(
                        minimumSize: const Size.fromHeight(48),
                        backgroundColor: destructive ? scheme.error : null,
                        foregroundColor: destructive ? scheme.onError : null,
                      ),
                      child: Text(confirmLabel),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    },
  );
  return confirmed == true;
}

/// 확인 팝업을 띄운 뒤 로그아웃한다.
Future<void> confirmAndSignOut(BuildContext context, WidgetRef ref) async {
  final messenger = ScaffoldMessenger.of(context);
  if (!await _confirm(context, title: '로그아웃 하시겠어요?', confirmLabel: '로그아웃')) return;
  try {
    await ref.read(authActionsProvider).signOut();
  } on AuthActionException catch (error) {
    messenger.showSnackBar(SnackBar(content: Text(error.message)));
  }
}

/// 확인 팝업을 띄운 뒤 회원탈퇴(계정 삭제)한다. 탈퇴했으면 true.
Future<bool> confirmAndDeleteAccount(BuildContext context, WidgetRef ref) async {
  final messenger = ScaffoldMessenger.of(context);
  final confirmed = await _confirm(
    context,
    title: '회원탈퇴 하시겠어요?',
    message: '계정과 계정에 저장된 오답노트·이력서·면접 기록이 바로 삭제되며 되돌릴 수 없습니다.',
    confirmLabel: '탈퇴',
    destructive: true,
  );
  if (!confirmed) return false;

  try {
    await ref.read(authActionsProvider).deleteAccount();
    messenger.showSnackBar(const SnackBar(content: Text('회원탈퇴가 완료되었습니다.')));
    return true;
  } on AuthActionException catch (error) {
    messenger.showSnackBar(SnackBar(content: Text(error.message)));
    return false;
  }
}
