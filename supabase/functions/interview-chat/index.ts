import { createClient } from 'npm:@supabase/supabase-js@2';

import { createLlmProvider } from './_shared/llm/factory.ts';
import type { ChatMessage } from './_shared/llm/types.ts';
import { buildSystemPrompt, truncateHistory, type HistoryMessage } from './_shared/prompt.ts';
import { extractClientIp, fetchRateLimitConfig, hashSubjectKey } from './_shared/rate_limit.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function serviceRoleClient() {
  return createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
}

async function resolveSubjectKeys(
  req: Request,
): Promise<{ deviceKey: string; ipKey: string } | null> {
  const deviceId = req.headers.get('x-device-id');
  if (!deviceId) {
    return null;
  }

  const salt = Deno.env.get('GUEST_HASH_SALT') ?? '';
  const ip = extractClientIp(req.headers);
  const deviceKey = await hashSubjectKey(deviceId, salt);
  const ipKey = await hashSubjectKey(ip, salt);
  return { deviceKey, ipKey };
}

/** 카운트를 증가시키지 않는 읽기 전용 사용량 조회. 앱 배너의 초기값용. */
async function handleUsage(req: Request): Promise<Response> {
  const subjects = await resolveSubjectKeys(req);
  if (!subjects) {
    return jsonResponse(400, {
      code: 'MISSING_DEVICE_ID',
      message: 'X-Device-Id 헤더가 필요합니다.',
    });
  }

  const client = serviceRoleClient();

  try {
    const { guestDeviceLimit, guestIpLimit } = await fetchRateLimitConfig(client);
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await client
      .from('guest_daily_usage')
      .select('subject_type, subject_key, interview_messages_count')
      .eq('usage_date', today)
      .in('subject_key', [subjects.deviceKey, subjects.ipKey]);

    if (error) {
      throw error;
    }

    const rows = data as { subject_type: string; subject_key: string; interview_messages_count: number }[];
    const deviceCount =
      rows.find((row) => row.subject_type === 'device' && row.subject_key === subjects.deviceKey)
        ?.interview_messages_count ?? 0;
    const ipCount =
      rows.find((row) => row.subject_type === 'ip' && row.subject_key === subjects.ipKey)
        ?.interview_messages_count ?? 0;

    return jsonResponse(200, {
      deviceRemaining: Math.max(guestDeviceLimit - deviceCount, 0),
      ipRemaining: Math.max(guestIpLimit - ipCount, 0),
    });
  } catch {
    return jsonResponse(500, { code: 'USAGE_LOOKUP_FAILED', message: '사용량을 불러오지 못했습니다.' });
  }
}

interface ChatRequestBody {
  categoryName?: string;
  jobTitle?: string;
  resumeText?: string;
  history?: HistoryMessage[];
  message?: string;
}

async function handleChat(req: Request): Promise<Response> {
  const subjects = await resolveSubjectKeys(req);
  if (!subjects) {
    return jsonResponse(400, {
      code: 'MISSING_DEVICE_ID',
      message: 'X-Device-Id 헤더가 필요합니다.',
    });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { code: 'INVALID_BODY', message: '요청 본문이 올바르지 않습니다.' });
  }

  if (!body.message || !body.resumeText || !body.categoryName || !body.jobTitle) {
    return jsonResponse(400, {
      code: 'MISSING_FIELDS',
      message: 'message/resumeText/categoryName/jobTitle이 모두 필요합니다.',
    });
  }

  const client = serviceRoleClient();

  let guestDeviceLimit: number;
  let guestIpLimit: number;
  try {
    ({ guestDeviceLimit, guestIpLimit } = await fetchRateLimitConfig(client));
  } catch {
    return jsonResponse(500, { code: 'RATE_LIMIT_CONFIG_FAILED', message: '한도 설정을 불러오지 못했습니다.' });
  }

  const { data: usageRow, error: usageError } = await client.rpc('increment_guest_usage', {
    p_device_key: subjects.deviceKey,
    p_ip_key: subjects.ipKey,
    p_device_limit: guestDeviceLimit,
    p_ip_limit: guestIpLimit,
  });

  if (usageError) {
    return jsonResponse(500, { code: 'RATE_LIMIT_CHECK_FAILED', message: '사용량 확인에 실패했습니다.' });
  }

  const usage = (Array.isArray(usageRow) ? usageRow[0] : usageRow) as {
    allowed: boolean;
    blocked_by: string | null;
    device_remaining: number;
    ip_remaining: number;
  };

  if (!usage?.allowed) {
    return jsonResponse(429, {
      code: 'RATE_LIMITED',
      blockedBy: usage?.blocked_by ?? null,
      deviceRemaining: usage?.device_remaining ?? 0,
      ipRemaining: usage?.ip_remaining ?? 0,
    });
  }

  const history = truncateHistory(body.history ?? []);
  const systemPrompt = buildSystemPrompt({
    categoryName: body.categoryName,
    jobTitle: body.jobTitle,
    resumeText: body.resumeText,
  });
  const messages: ChatMessage[] = [
    ...history.map((message) => ({ role: message.role, content: message.content })),
    { role: 'user', content: body.message },
  ];

  let provider;
  try {
    provider = createLlmProvider();
  } catch {
    return jsonResponse(500, { code: 'LLM_CONFIG_ERROR', message: 'LLM 설정 오류입니다.' });
  }

  const iterator = provider.streamChat({ systemPrompt, messages })[Symbol.asyncIterator]();

  // 첫 조각을 스트림 시작 전에 미리 받아, 벤더 인증 실패 등을 깨끗한 4xx/5xx로 돌려준다.
  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch {
    return jsonResponse(502, {
      code: 'LLM_UPSTREAM_ERROR',
      message: '면접 답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          sseEvent('usage', {
            deviceRemaining: usage.device_remaining,
            ipRemaining: usage.ip_remaining,
          }),
        ),
      );

      try {
        let current = first;
        while (!current.done) {
          controller.enqueue(encoder.encode(sseEvent('delta', { text: current.value })));
          current = await iterator.next();
        }
        controller.enqueue(encoder.encode(sseEvent('done', {})));
      } catch {
        controller.enqueue(
          encoder.encode(
            sseEvent('error', {
              code: 'LLM_UPSTREAM_ERROR',
              message: '면접 답변 생성 중 오류가 발생했습니다.',
            }),
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method === 'GET') {
    return handleUsage(req);
  }

  if (req.method === 'POST') {
    return handleChat(req);
  }

  return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED', message: 'GET/POST만 지원합니다.' });
});
