import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/legal/legal_links.dart';
import 'package:my_app/features/me/presentation/settings_page.dart';

void main() {
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
