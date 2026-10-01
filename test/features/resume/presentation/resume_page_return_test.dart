import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:my_app/features/resume/domain/resume.dart';
import 'package:my_app/features/resume/domain/resume_repository.dart';
import 'package:my_app/features/resume/presentation/resume_page.dart';
import 'package:my_app/features/resume/presentation/resume_providers.dart';

class _FakeResumeRepository implements ResumeRepository {
  Resume? saved;

  @override
  Future<Resume?> fetch() async => saved;

  @override
  Future<void> save(Resume resume) async {
    saved = resume;
  }
}

Future<void> _pumpResumeFlow(WidgetTester tester, {required bool returnToInterview}) async {
  final router = GoRouter(
    initialLocation: '/me/resume',
    routes: [
      GoRoute(path: '/interview', builder: (context, state) => const Scaffold(body: Text('모의면접 화면'))),
      GoRoute(
        path: '/me/resume',
        builder: (context, state) => ResumePage(returnToInterview: returnToInterview),
      ),
    ],
  );
  await tester.pumpWidget(
    ProviderScope(
      overrides: [resumeRepositoryProvider.overrideWithValue(_FakeResumeRepository())],
      child: MaterialApp.router(routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('모의면접에서 넘어온 경우 이력서를 저장하면 모의면접으로 돌아간다', (tester) async {
    await _pumpResumeFlow(tester, returnToInterview: true);

    await tester.enterText(find.byType(TextField).first, '5년차 백엔드 개발자');
    await tester.ensureVisible(find.text('저장'));
    await tester.tap(find.text('저장'));
    await tester.pumpAndSettle();

    expect(find.text('모의면접 화면'), findsOneWidget);
  });

  testWidgets('다른 경로에서 들어온 경우 이력서를 저장해도 이력서 화면에 머문다', (tester) async {
    await _pumpResumeFlow(tester, returnToInterview: false);

    await tester.enterText(find.byType(TextField).first, '5년차 백엔드 개발자');
    await tester.ensureVisible(find.text('저장'));
    await tester.tap(find.text('저장'));
    await tester.pumpAndSettle();

    expect(find.text('모의면접 화면'), findsNothing);
    expect(find.text('이력서를 저장했습니다.'), findsOneWidget);
  });
}
