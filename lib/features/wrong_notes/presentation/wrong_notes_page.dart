import 'package:flutter/material.dart';

/// 오답노트 화면 placeholder. 실제 목록은 M2에서 만든다.
class WrongNotesPage extends StatelessWidget {
  const WrongNotesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('오답노트')),
      body: const Center(child: Text('오답노트 기능은 준비 중입니다.')),
    );
  }
}
