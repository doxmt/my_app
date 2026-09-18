import 'dart:convert';

import 'package:http/http.dart' as http;

import '../domain/pdf_extraction_client.dart';

class VercelPdfExtractionClient implements PdfExtractionClient {
  VercelPdfExtractionClient(this._client, this._baseUrl);

  final http.Client _client;
  final String _baseUrl;

  @override
  Future<String> extractText(List<int> pdfBytes) async {
    final http.Response response;
    try {
      response = await _client.post(
        Uri.parse('$_baseUrl/api/parse-pdf'),
        headers: {'Content-Type': 'application/octet-stream'},
        body: pdfBytes,
      );
    } catch (_) {
      throw const PdfNetworkException();
    }

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return json['text'] as String;
    }

    throw _exceptionFor(_errorCode(response.body));
  }

  String? _errorCode(String body) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['code'] as String?;
    } catch (_) {
      return null;
    }
  }

  PdfExtractionException _exceptionFor(String? code) {
    switch (code) {
      case 'TOO_LARGE':
        return const PdfTooLargeException();
      case 'TOO_MANY_PAGES':
        return const PdfTooManyPagesException();
      case 'INVALID_PDF':
      case 'EMPTY_BODY':
        return const PdfInvalidException();
      default:
        return const PdfParseFailedException();
    }
  }
}
