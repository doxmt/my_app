const MAX_PDF_BYTES = 4 * 1024 * 1024;

const MESSAGES: Record<string, string> = {
  TOO_LARGE: "PDF 크기가 너무 큽니다. 더 작은 파일로 시도해주세요.",
  INVALID_PDF: "PDF 파일이 아니거나 손상되었습니다.",
  EMPTY_BODY: "PDF 파일이 아니거나 손상되었습니다.",
  TOO_MANY_PAGES: "PDF 페이지 수가 너무 많습니다.",
};

export class PdfExtractionError extends Error {}

/** 같은 오리진의 `/api/parse-pdf`에 PDF 바이트를 보내 텍스트를 받는다. 추출은 서버(Node 함수)만 한다. */
export async function extractPdfText(file: File): Promise<string> {
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfExtractionError(MESSAGES.TOO_LARGE);
  }

  let response: Response;
  try {
    response = await fetch("/api/parse-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: file,
    });
  } catch {
    throw new PdfExtractionError("네트워크 연결을 확인해주세요.");
  }

  if (response.ok) {
    const json = (await response.json()) as { text: string };
    return json.text;
  }

  if (response.status === 413) throw new PdfExtractionError(MESSAGES.TOO_LARGE);
  const json = (await response.json().catch(() => ({}))) as { code?: string };
  throw new PdfExtractionError(MESSAGES[json.code ?? ""] ?? "PDF에서 텍스트를 추출하지 못했습니다.");
}
