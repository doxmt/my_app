import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/resume/domain/resume.dart';
import 'package:my_app/features/resume/domain/resume_repository.dart';
import 'package:my_app/features/resume/presentation/resume_page.dart';
import 'package:my_app/features/resume/presentation/resume_providers.dart';

class _FakeResumeRepository implements ResumeRepository {
  _FakeResumeRepository(this.saved);

  Resume? saved;

  @override
  Future<Resume?> fetch() async => saved;

  @override
  Future<void> save(Resume resume) async {
    saved = resume;
  }
}

const _resumeWithIntro = '홍길동\n자기소개\n저는 백엔드 개발자입니다.\n경력\n회사 A';
const _resumeWithoutIntro = '홍길동\n경력\n회사 A';

Resume _resume(String text, {String selfIntroduction = ''}) {
  return Resume(
    sourceType: ResumeSourceType.paste,
    text: text,
    updatedAt: DateTime.utc(2026, 9, 18),
    selfIntroduction: selfIntroduction,
  );
}

Future<_FakeResumeRepository> _pump(
  WidgetTester tester, {
  Resume? initial,
}) async {
  final repository = _FakeResumeRepository(initial);
  await tester.pumpWidget(
    ProviderScope(
      overrides: [resumeRepositoryProvider.overrideWithValue(repository)],
      child: const MaterialApp(home: ResumePage()),
    ),
  );
  await tester.pumpAndSettle();
  return repository;
}

Future<void> _tapVisible(WidgetTester tester, String text) async {
  await tester.ensureVisible(find.text(text));
  await tester.tap(find.text(text));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('저장할 때 자기소개 칸이 비어 있고 이력서에 자기소개 항목이 있으면 채워서 저장한다', (tester) async {
    final repository = await _pump(tester);

    await tester.enterText(find.byType(TextField).first, _resumeWithIntro);
    await _tapVisible(tester, '저장');

    expect(repository.saved?.selfIntroduction, '저는 백엔드 개발자입니다.');
  });

  testWidgets('이미 입력한 자기소개는 저장할 때 덮어쓰지 않는다', (tester) async {
    final repository = await _pump(tester);

    await tester.enterText(find.byType(TextField).first, _resumeWithIntro);
    await tester.enterText(find.byType(TextField).last, '직접 쓴 자기소개');
    await _tapVisible(tester, '저장');

    expect(repository.saved?.selfIntroduction, '직접 쓴 자기소개');
  });

  testWidgets('자기소개 항목이 없으면 빈 값으로 저장한다', (tester) async {
    final repository = await _pump(tester);

    await tester.enterText(find.byType(TextField).first, _resumeWithoutIntro);
    await _tapVisible(tester, '저장');

    expect(repository.saved?.selfIntroduction, '');
  });

  testWidgets('이력서에서 가져오기 버튼이 자기소개 칸을 채운다', (tester) async {
    await _pump(tester);

    await tester.enterText(find.byType(TextField).first, _resumeWithIntro);
    await _tapVisible(tester, '이력서에서 가져오기');

    expect(find.text('저는 백엔드 개발자입니다.'), findsOneWidget);
    expect(find.text('이력서에서 자기소개를 가져왔어요.'), findsOneWidget);
  });

  testWidgets('가져오기는 입력한 내용을 덮어쓰고 덮어썼다고 알려준다', (tester) async {
    await _pump(
      tester,
      initial: _resume(_resumeWithIntro, selfIntroduction: '직접 쓴 자기소개'),
    );

    await _tapVisible(tester, '이력서에서 가져오기');

    expect(find.text('직접 쓴 자기소개'), findsNothing);
    expect(find.text('저는 백엔드 개발자입니다.'), findsOneWidget);
    expect(find.text('이력서의 자기소개로 입력 내용을 바꿨어요.'), findsOneWidget);
  });

  testWidgets('이력서에서 자기소개를 못 찾으면 안내하고 입력 내용은 그대로 둔다', (tester) async {
    await _pump(
      tester,
      initial: _resume(_resumeWithoutIntro, selfIntroduction: '직접 쓴 자기소개'),
    );

    await _tapVisible(tester, '이력서에서 가져오기');

    expect(find.text('이력서에서 자기소개 항목을 찾지 못했어요. 직접 입력해 주세요.'), findsOneWidget);
    expect(find.text('직접 쓴 자기소개'), findsOneWidget);
  });

  testWidgets('저장된 자기소개가 입력칸에 미리 채워진다', (tester) async {
    await _pump(
      tester,
      initial: _resume(_resumeWithoutIntro, selfIntroduction: '저장된 자기소개'),
    );

    expect(find.text('저장된 자기소개'), findsOneWidget);
  });
}
