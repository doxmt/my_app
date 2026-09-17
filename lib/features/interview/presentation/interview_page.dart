import 'package:flutter/material.dart';

/// 모의면접 탭 placeholder. 실제 채팅 흐름은 M3/M4에서 만든다.
class InterviewPage extends StatelessWidget {
  const InterviewPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('모의면접')),
      body: const Center(child: Text('모의면접 기능은 준비 중입니다.')),
    );
  }
}
