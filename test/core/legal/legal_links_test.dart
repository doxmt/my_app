import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/core/legal/legal_links.dart';

void main() {
  test('오리진으로 방침·약관 URL을 만든다', () {
    final urls = LegalUrls.fromOrigin('https://example.com');

    expect(urls.privacy, Uri.parse('https://example.com/privacy'));
    expect(urls.terms, Uri.parse('https://example.com/terms'));
  });

  test('오리진 끝의 슬래시는 무시한다', () {
    final urls = LegalUrls.fromOrigin('https://example.com/');

    expect(urls.privacy, Uri.parse('https://example.com/privacy'));
    expect(urls.terms, Uri.parse('https://example.com/terms'));
  });
}
