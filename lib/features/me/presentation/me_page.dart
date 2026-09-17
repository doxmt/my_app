import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// 내 정보 탭. 오답노트 메뉴 항목 하나를 보여준다.
class MePage extends StatelessWidget {
  const MePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('내 정보')),
      body: ListView(
        children: [
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
