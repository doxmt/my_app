// deno-lint-ignore no-explicit-any
type SupabaseClientLike = any;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

/**
 * 계정 삭제. 삭제 대상은 요청 JWT를 검증해 얻은 사용자뿐이다 — 요청 본문은 읽지 않는다.
 * 회원 테이블은 `auth.users ... on delete cascade` FK로 함께 지워진다.
 */
export async function handleDeleteAccount(req: Request, client: SupabaseClientLike): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { code: 'METHOD_NOT_ALLOWED', message: 'POST만 지원합니다.' });
  }

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return jsonResponse(401, { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' });
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return jsonResponse(401, { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' });
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('delete-account failed', deleteError);
    return jsonResponse(500, { code: 'DELETE_FAILED', message: '계정 삭제에 실패했습니다.' });
  }

  return jsonResponse(200, { deleted: true });
}
