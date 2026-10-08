import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/features/auth/data/auth_actions.dart';
import 'package:my_app/features/auth/domain/auth_exception.dart';
import 'package:my_app/features/auth/presentation/auth_providers.dart';
import 'package:my_app/features/me/presentation/account_actions.dart';

class _FakeAuthActions implements AuthActions {
  _FakeAuthActions({this.fail = false});

  final bool fail;
  int signOutCalls = 0;

  @override
  Future<void> signOut() async {
    signOutCalls++;
    if (fail) throw const AuthActionException('로그아웃에 실패했습니다. 다시 시도해주세요.');
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Widget _app(AuthActions actions) {
  return ProviderScope(
    overrides: [authActionsProvider.overrideWithValue(actions)],
    child: MaterialApp(
      home: Scaffold(
        body: Consumer(
          builder: (context, ref, _) => TextButton(
            onPressed: () => confirmAndSignOut(context, ref),
            child: const Text('로그아웃 버튼'),
          ),
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('로그아웃을 누르면 확인 팝업이 뜨고 취소하면 로그아웃하지 않는다', (tester) async {
    final actions = _FakeAuthActions();
    await tester.pumpWidget(_app(actions));

    await tester.tap(find.text('로그아웃 버튼'));
    await tester.pumpAndSettle();
    expect(find.text('로그아웃 하시겠어요?'), findsOneWidget);
    expect(actions.signOutCalls, 0);

    await tester.tap(find.text('취소'));
    await tester.pumpAndSettle();

    expect(actions.signOutCalls, 0);
    expect(find.text('로그아웃 하시겠어요?'), findsNothing);
  });

  testWidgets('팝업에서 로그아웃을 확인하면 로그아웃한다', (tester) async {
    final actions = _FakeAuthActions();
    await tester.pumpWidget(_app(actions));

    await tester.tap(find.text('로그아웃 버튼'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, '로그아웃'));
    await tester.pumpAndSettle();

    expect(actions.signOutCalls, 1);
  });

  testWidgets('로그아웃에 실패하면 오류를 알린다', (tester) async {
    await tester.pumpWidget(_app(_FakeAuthActions(fail: true)));

    await tester.tap(find.text('로그아웃 버튼'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, '로그아웃'));
    await tester.pumpAndSettle();

    expect(find.text('로그아웃에 실패했습니다. 다시 시도해주세요.'), findsOneWidget);
  });
}
