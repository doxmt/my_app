import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/app_config.dart';

/// 개인정보처리방침·이용약관 URL. 웹(Next)의 `/privacy`, `/terms`와 같은 오리진을 쓴다.
class LegalUrls {
  const LegalUrls({required this.privacy, required this.terms});

  factory LegalUrls.fromOrigin(String origin) {
    final base = origin.endsWith('/')
        ? origin.substring(0, origin.length - 1)
        : origin;
    return LegalUrls(
      privacy: Uri.parse('$base/privacy'),
      terms: Uri.parse('$base/terms'),
    );
  }

  final Uri privacy;
  final Uri terms;
}

/// 웹과 같은 오리진(`PDF_PARSE_BASE_URL`)에서 방침·약관 URL을 만든다.
final legalUrlsProvider = Provider<LegalUrls>((ref) {
  return LegalUrls.fromOrigin(ref.watch(appConfigProvider).pdfParseBaseUrl);
});

/// 외부 브라우저로 URL을 연다. 테스트는 fake를 주입한다.
final externalUrlOpenerProvider = Provider<Future<bool> Function(Uri)>((ref) {
  return (uri) => launchUrl(uri, mode: LaunchMode.externalApplication);
});

/// 이용약관·개인정보처리방침 링크 버튼 한 줄.
class LegalLinkButtons extends ConsumerWidget {
  const LegalLinkButtons({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    void open(Uri Function(LegalUrls) pick) {
      ref.read(externalUrlOpenerProvider)(pick(ref.read(legalUrlsProvider)));
    }

    return Wrap(
      alignment: WrapAlignment.center,
      children: [
        TextButton(
          onPressed: () => open((urls) => urls.terms),
          child: const Text('이용약관'),
        ),
        TextButton(
          onPressed: () => open((urls) => urls.privacy),
          child: const Text('개인정보처리방침'),
        ),
      ],
    );
  }
}
