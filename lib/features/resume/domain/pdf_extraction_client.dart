/// PDF에서 텍스트를 추출하는 클라이언트 인터페이스. 실제 구현은 Vercel 함수를 호출한다.
abstract class PdfExtractionClient {
  Future<String> extractText(List<int> pdfBytes);
}

sealed class PdfExtractionException implements Exception {
  const PdfExtractionException(this.message);

  final String message;
}

class PdfTooLargeException extends PdfExtractionException {
  const PdfTooLargeException() : super('PDF 크기가 너무 큽니다. 더 작은 파일로 시도해주세요.');
}

class PdfInvalidException extends PdfExtractionException {
  const PdfInvalidException() : super('PDF 파일이 아니거나 손상되었습니다.');
}

class PdfTooManyPagesException extends PdfExtractionException {
  const PdfTooManyPagesException() : super('PDF 페이지 수가 너무 많습니다.');
}

class PdfNetworkException extends PdfExtractionException {
  const PdfNetworkException() : super('네트워크 연결을 확인해주세요.');
}

class PdfParseFailedException extends PdfExtractionException {
  const PdfParseFailedException() : super('PDF에서 텍스트를 추출하지 못했습니다.');
}
