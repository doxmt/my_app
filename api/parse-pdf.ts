import type { IncomingMessage, ServerResponse } from 'node:http';
import { extractText, getDocumentProxy } from 'unpdf';

// Vercel Function 요청 본문 한도(4.5MB)보다 여유를 둔 자체 상한.
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_PAGES = 20;
const PDF_MAGIC = Buffer.from('%PDF-');

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

function applyCors(req: IncomingMessage, res: ServerResponse) {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendError(res: ServerResponse, status: number, code: string, message: string) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ code, error: message }));
}

async function readRawBody(req: IncomingMessage & { body?: unknown }): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: IncomingMessage & { method?: string; body?: unknown },
  res: ServerResponse,
) {
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'POST만 지원합니다.');
    return;
  }

  const body = await readRawBody(req);

  if (body.length === 0) {
    sendError(res, 400, 'EMPTY_BODY', '요청 본문이 비어 있습니다.');
    return;
  }

  if (body.length > MAX_BODY_BYTES) {
    sendError(
      res,
      413,
      'TOO_LARGE',
      `PDF 크기는 ${MAX_BODY_BYTES / (1024 * 1024)}MB를 넘을 수 없습니다.`,
    );
    return;
  }

  if (!body.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    sendError(res, 400, 'INVALID_PDF', 'PDF 파일이 아닙니다.');
    return;
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(body));

    if (pdf.numPages > MAX_PAGES) {
      sendError(res, 400, 'TOO_MANY_PAGES', `페이지는 ${MAX_PAGES}장을 넘을 수 없습니다.`);
      return;
    }

    const { text } = await extractText(pdf, { mergePages: true });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ text }));
  } catch {
    sendError(res, 400, 'PARSE_FAILED', 'PDF에서 텍스트를 추출하지 못했습니다.');
  }
}
