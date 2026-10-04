import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:my_app/features/resume/data/vercel_pdf_extraction_client.dart';
import 'package:my_app/features/resume/domain/pdf_extraction_client.dart';

void main() {
  test('4MB를 넘는 PDF는 서버로 보내지 않고 PdfTooLargeException을 던진다', () async {
    var requests = 0;
    final client = VercelPdfExtractionClient(
      MockClient((request) async {
        requests++;
        return http.Response('{}', 200);
      }),
      'https://example.com',
    );

    await expectLater(
      client.extractText(List<int>.filled(maxPdfBytes + 1, 0)),
      throwsA(isA<PdfTooLargeException>()),
    );
    expect(requests, 0);
  });

  test('한도 이하 PDF는 /api/parse-pdf로 보내 텍스트를 받는다', () async {
    late Uri requested;
    final client = VercelPdfExtractionClient(
      MockClient((request) async {
        requested = request.url;
        return http.Response.bytes(
          utf8.encode(jsonEncode({'text': '이력서 내용'})),
          200,
          headers: {'content-type': 'application/json; charset=utf-8'},
        );
      }),
      'https://example.com',
    );

    final text = await client.extractText([1, 2, 3]);

    expect(text, '이력서 내용');
    expect(requested, Uri.parse('https://example.com/api/parse-pdf'));
  });

  test('서버가 TOO_MANY_PAGES를 돌려주면 PdfTooManyPagesException을 던진다', () async {
    final client = VercelPdfExtractionClient(
      MockClient((request) async => http.Response(jsonEncode({'code': 'TOO_MANY_PAGES'}), 400)),
      'https://example.com',
    );

    expect(client.extractText([1]), throwsA(isA<PdfTooManyPagesException>()));
  });
}
