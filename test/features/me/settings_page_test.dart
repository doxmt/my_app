import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/legal/legal_links.dart';
import 'package:my_app/features/auth/data/auth_actions.dart';
import 'package:my_app/features/auth/domain/auth_exception.dart';
import 'package:my_app/features/auth/presentation/auth_providers.dart';
import 'package:my_app/features/me/presentation/settings_page.dart';

class _FixedCurrentUserId extends CurrentUserIdNotifier {
  _FixedCurrentUserId(this._value);

  final String? _value;

  @override
  String? build() => _value;
}

class _FakeAuthActions implements AuthActions {
  _FakeAuthActions({this.fail = false});

  final bool fail;
  int deleteCalls = 0;

  @override
  Future<void> deleteAccount() async {
    deleteCalls++;
    if (fail) throw const AuthActionException('회원탈퇴에 실패했습니다. 다시 시도해주세요.');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Widget _settings({required String? userId, required AuthActions actions}) {
  return ProviderScope(
    overrides: [
      legalUrlsProvider.overrideWithValue(LegalUrls.fromOrigin('https://example.com')),
      appVersionProvider.overrideWith((ref) async => '1.2.3 (45)'),
      currentUserIdProvider.overrideWith(() => _FixedCurrentUserId(userId)),
      authActionsProvider.overrideWithValue(actions),
    ],
    child: MaterialApp(
      home: Builder(
        builder: (context) => Scaffold(
          body: TextButton(
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(builder: (_) => const SettingsPage()),
            ),
            child: const Text('열기'),
          ),
        ),
      ),
    ),
  );
}

Future<void> _open(WidgetTester tester) async {
  await tester.tap(find.text('열기'));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('비회원에게는 회원탈퇴가 보이지 않는다', (tester) async {
    await tester.pumpWidget(_settings(userId: null, actions: _FakeAuthActions()));
    await _open(tester);

    expect(find.text('회원탈퇴'), findsNothing);
  });

  testWidgets('확인 대화상자에서 취소하면 삭제하지 않는다', (tester) async {
    final actions = _FakeAuthActions();
    await tester.pumpWidget(_settings(userId: 'user-1', actions: actions));
    await _open(tester);

    await tester.tap(find.text('회원탈퇴'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('취소'));
    await tester.pumpAndSettle();

    expect(actions.deleteCalls, 0);
    expect(find.text('설정'), findsOneWidget);
  });

  testWidgets('확인하면 계정을 삭제하고 설정 화면을 닫는다', (tester) async {
    final actions = _FakeAuthActions();
    await tester.pumpWidget(_settings(userId: 'user-1', actions: actions));
    await _open(tester);

    await tester.tap(find.text('회원탈퇴'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('탈퇴'));
    await tester.pumpAndSettle();

    expect(actions.deleteCalls, 1);
    expect(find.text('설정'), findsNothing);
    expect(find.text('회원탈퇴가 완료되었습니다.'), findsOneWidget);
  });

  testWidgets('삭제가 실패하면 오류를 알리고 화면에 남는다', (tester) async {
    final actions = _FakeAuthActions(fail: true);
    await tester.pumpWidget(_settings(userId: 'user-1', actions: actions));
    await _open(tester);

    await tester.tap(find.text('회원탈퇴'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('탈퇴'));
    await tester.pumpAndSettle();

    expect(find.text('회원탈퇴에 실패했습니다. 다시 시도해주세요.'), findsOneWidget);
    expect(find.text('설정'), findsOneWidget);
  });

  testWidgets('방침·약관을 외부 브라우저로 열고 앱 버전을 보여준다', (tester) async {
    final opened = <Uri>[];
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          legalUrlsProvider.overrideWithValue(
            LegalUrls.fromOrigin('https://example.com'),
          ),
          externalUrlOpenerProvider.overrideWithValue((uri) async {
            opened.add(uri);
            return true;
          }),
          appVersionProvider.overrideWith((ref) async => '1.2.3 (45)'),
          currentUserIdProvider.overrideWith(() => _FixedCurrentUserId(null)),
        ],
        child: const MaterialApp(home: SettingsPage()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1.2.3 (45)'), findsOneWidget);

    await tester.tap(find.text('개인정보처리방침'));
    await tester.tap(find.text('이용약관'));
    await tester.pump();

    expect(opened, [
      Uri.parse('https://example.com/privacy'),
      Uri.parse('https://example.com/terms'),
    ]);
  });
}
