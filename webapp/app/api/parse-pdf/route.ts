import { extractText, getDocumentProxy } from "unpdf";

// 루트 `api/parse-pdf.ts`(모바일 앱이 쓰는 함수)와 같은 동작의 사본. 컷오버 후 모바일이 이 엔드포인트를 쓴다.
export const runtime = "nodejs";
export const maxDuration = 30;

// Vercel Function 요청 본문 한도(4.5MB)보다 여유를 둔 자체 상한.
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_PAGES = 20;
const PDF_MAGIC = new TextEncoder().encode("%PDF-");

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function corsHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const origin = request.headers.get("origin");
  if (origin !== null && allowedOrigins().includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return headers;
}

function jsonResponse(request: Request, status: number, body: unknown) {
  return Response.json(body, { status, headers: corsHeaders(request) });
}

function errorResponse(request: Request, status: number, code: string, message: string) {
  return jsonResponse(request, status, { code, error: message });
}

const tooLarge = (request: Request) =>
  errorResponse(request, 413, "TOO_LARGE", `PDF 크기는 ${MAX_BODY_BYTES / (1024 * 1024)}MB를 넘을 수 없습니다.`);

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return tooLarge(request);

  const body = new Uint8Array(await request.arrayBuffer());

  if (body.length === 0) {
    return errorResponse(request, 400, "EMPTY_BODY", "요청 본문이 비어 있습니다.");
  }
  if (body.length > MAX_BODY_BYTES) return tooLarge(request);
  if (!PDF_MAGIC.every((byte, index) => body[index] === byte)) {
    return errorResponse(request, 400, "INVALID_PDF", "PDF 파일이 아닙니다.");
  }

  try {
    const pdf = await getDocumentProxy(body);

    if (pdf.numPages > MAX_PAGES) {
      return errorResponse(request, 400, "TOO_MANY_PAGES", `페이지는 ${MAX_PAGES}장을 넘을 수 없습니다.`);
    }

    const { text } = await extractText(pdf, { mergePages: true });
    return jsonResponse(request, 200, { text });
  } catch {
    return errorResponse(request, 400, "PARSE_FAILED", "PDF에서 텍스트를 추출하지 못했습니다.");
  }
}

// 그 외 메서드는 405.
export function GET(request: Request) {
  return errorResponse(request, 405, "METHOD_NOT_ALLOWED", "POST만 지원합니다.");
}
