import { createClient } from 'npm:@supabase/supabase-js@2';

import { createLlmProvider } from './_shared/llm/factory.ts';
import type { ChatMessage } from './_shared/llm/types.ts';
import { resolveMemberUser } from './_shared/member_auth.ts';
import { buildSystemPrompt, truncateHistory, type HistoryMessage } from './_shared/prompt.ts';
import {
  extractClientIp,
  fetchMemberLimit,
  fetchRateLimitConfig,
  hashSubjectKey,
} from './_shared/rate_limit.ts';

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
  const client = serviceRoleClient();
  const member = await resolveMemberUser(req, client);

  if (member) {
    return handleMemberUsage(client, member.userId);
  }

  const subjects = await resolveSubjectKeys(req);
  if (!subjects) {
    return jsonResponse(400, {
      code: 'MISSING_DEVICE_ID',
      message: 'X-Device-Id 헤더가 필요합니다.',
    });
  }

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

/** 회원용 읽기 전용 사용량 조회. 카운트를 증가시키지 않는다. */
async function handleMemberUsage(
  client: ReturnType<typeof serviceRoleClient>,
  userId: string,
): Promise<Response> {
  try {
    const freeLimit = await fetchMemberLimit(client);
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await client
      .from('daily_usage')
      .select('interview_messages_count')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const count = (data as { interview_messages_count: number } | null)?.interview_messages_count ?? 0;
    return jsonResponse(200, { tier: 'free', remaining: Math.max(freeLimit - count, 0) });
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
  const client = serviceRoleClient();

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { code: 'INVALID_BODY', message: '요청 본문이 올바르지 않습니다.' });
  }

  if (!body.message || !body.categoryName || !body.jobTitle) {
    return jsonResponse(400, {
      code: 'MISSING_FIELDS',
      message: 'message/categoryName/jobTitle이 모두 필요합니다.',
    });
  }

  const member = await resolveMemberUser(req, client);
  if (member) {
    return handleMemberChat(client, member.userId, body);
  }

  if (!body.resumeText) {
    return jsonResponse(400, {
      code: 'MISSING_FIELDS',
      message: 'message/resumeText/categoryName/jobTitle이 모두 필요합니다.',
    });
  }

  const subjects = await resolveSubjectKeys(req);
  if (!subjects) {
    return jsonResponse(400, {
      code: 'MISSING_DEVICE_ID',
      message: 'X-Device-Id 헤더가 필요합니다.',
    });
  }

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
  } catch (error) {
    console.error('LLM upstream error (guest, first chunk):', error);
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
      } catch (error) {
        console.error('LLM upstream error (guest, stream):', error);
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

/**
 * 회원 경로. 클라이언트가 보낸 resumeText/history는 신뢰하지 않고 DB 기준(이력서·대화 이력)으로
 * 프롬프트를 구성한다. 진행 중인(status='active') 세션이 있으면 이어서 쓰고, 없으면 새로 만든다.
 * 사용자 메시지와 모델 응답을 모두 `interview_messages`에 저장한다.
 */
async function handleMemberChat(
  client: ReturnType<typeof serviceRoleClient>,
  userId: string,
  body: ChatRequestBody,
): Promise<Response> {
  let freeLimit: number;
  try {
    freeLimit = await fetchMemberLimit(client);
  } catch {
    return jsonResponse(500, { code: 'RATE_LIMIT_CONFIG_FAILED', message: '한도 설정을 불러오지 못했습니다.' });
  }

  const { data: usageRow, error: usageError } = await client.rpc('increment_daily_usage', {
    p_user_id: userId,
    p_limit: freeLimit,
  });

  if (usageError) {
    return jsonResponse(500, { code: 'RATE_LIMIT_CHECK_FAILED', message: '사용량 확인에 실패했습니다.' });
  }

  const usage = (Array.isArray(usageRow) ? usageRow[0] : usageRow) as {
    allowed: boolean;
    remaining: number;
  };

  if (!usage?.allowed) {
    return jsonResponse(429, { code: 'RATE_LIMITED', tier: 'free', remaining: usage?.remaining ?? 0 });
  }

  const { data: resumeRows, error: resumeError } = await client
    .from('resumes')
    .select('extracted_text')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (resumeError) {
    return jsonResponse(500, { code: 'RESUME_LOOKUP_FAILED', message: '이력서를 불러오지 못했습니다.' });
  }
  const resumeText = (resumeRows as { extracted_text: string | null }[] | null)?.[0]?.extracted_text ?? '';

  const { data: activeSessionRows, error: sessionLookupError } = await client
    .from('interview_sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1);
  if (sessionLookupError) {
    return jsonResponse(500, { code: 'SESSION_LOOKUP_FAILED', message: '면접 세션을 불러오지 못했습니다.' });
  }

  let sessionId = (activeSessionRows as { id: string }[] | null)?.[0]?.id;
  if (!sessionId) {
    const { data: created, error: createError } = await client
      .from('interview_sessions')
      .insert({
        user_id: userId,
        provider: Deno.env.get('LLM_PROVIDER') ?? 'anthropic',
        model: Deno.env.get('LLM_MODEL') ?? null,
        status: 'active',
      })
      .select('id')
      .single();
    if (createError) {
      return jsonResponse(500, { code: 'SESSION_CREATE_FAILED', message: '면접 세션을 시작하지 못했습니다.' });
    }
    sessionId = (created as { id: string }).id;
  }

  const { data: historyRows, error: historyError } = await client
    .from('interview_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  if (historyError) {
    return jsonResponse(500, { code: 'HISTORY_LOOKUP_FAILED', message: '대화 이력을 불러오지 못했습니다.' });
  }

  const history = truncateHistory(
    (historyRows as { role: 'user' | 'assistant'; content: string }[] | null) ?? [],
  );
  const systemPrompt = buildSystemPrompt({
    categoryName: body.categoryName!,
    jobTitle: body.jobTitle!,
    resumeText,
  });
  const messages: ChatMessage[] = [
    ...history.map((message) => ({ role: message.role, content: message.content })),
    { role: 'user', content: body.message! },
  ];

  const { error: userMessageError } = await client.from('interview_messages').insert({
    session_id: sessionId,
    role: 'user',
    content: body.message,
  });
  if (userMessageError) {
    return jsonResponse(500, { code: 'MESSAGE_SAVE_FAILED', message: '메시지를 저장하지 못했습니다.' });
  }

  let provider;
  try {
    provider = createLlmProvider();
  } catch {
    return jsonResponse(500, { code: 'LLM_CONFIG_ERROR', message: 'LLM 설정 오류입니다.' });
  }

  const iterator = provider.streamChat({ systemPrompt, messages })[Symbol.asyncIterator]();

  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (error) {
    console.error('LLM upstream error (member, first chunk):', error);
    return jsonResponse(502, {
      code: 'LLM_UPSTREAM_ERROR',
      message: '면접 답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(
        encoder.encode(sseEvent('usage', { tier: 'free', remaining: usage.remaining })),
      );

      let fullReply = '';
      try {
        let current = first;
        while (!current.done) {
          fullReply += current.value;
          controller.enqueue(encoder.encode(sseEvent('delta', { text: current.value })));
          current = await iterator.next();
        }
        await client.from('interview_messages').insert({
          session_id: sessionId,
          role: 'assistant',
          content: fullReply,
        });
        controller.enqueue(encoder.encode(sseEvent('done', {})));
      } catch (error) {
        console.error('LLM upstream error (member, stream):', error);
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
