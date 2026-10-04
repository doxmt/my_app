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

/** Apple 토큰 철회. Apple 설정이 없으면 null을 넘긴다. */
export type RevokeApple = (authorizationCode: string) => Promise<void>;

function isAppleUser(user: SupabaseClientLike): boolean {
  const providers = user?.app_metadata?.providers;
  return Array.isArray(providers) && providers.includes('apple');
}

/**
 * 계정 삭제. 삭제 대상은 요청 JWT를 검증해 얻은 사용자뿐이다 — 본문의 user_id 같은 값은 쓰지 않는다.
 * 회원 테이블은 `auth.users ... on delete cascade` FK로 함께 지워진다.
 * Apple로 가입한 회원은 본문의 `appleAuthorizationCode`(앱이 재인증으로 받은 값)로 Apple 토큰을 먼저 철회하고,
 * 철회가 실패하면 계정을 지우지 않는다.
 */
export async function handleDeleteAccount(
  req: Request,
  client: SupabaseClientLike,
  revokeApple: RevokeApple | null = null,
): Promise<Response> {
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

  if (isAppleUser(data.user)) {
    const body = await req.json().catch(() => null);
    const code = body?.appleAuthorizationCode;
    if (typeof code !== 'string' || !code) {
      return jsonResponse(400, { code: 'APPLE_REAUTH_REQUIRED', message: 'Apple 인증을 다시 해주세요.' });
    }
    if (!revokeApple) {
      console.error('delete-account: Apple secrets are not configured');
      return jsonResponse(500, { code: 'APPLE_NOT_CONFIGURED', message: '계정 삭제에 실패했습니다.' });
    }
    try {
      await revokeApple(code);
    } catch (error) {
      console.error('delete-account: apple revoke failed', error);
      return jsonResponse(502, { code: 'APPLE_REVOKE_FAILED', message: 'Apple 연결 해제에 실패했습니다.' });
    }
    console.log('delete-account: apple token revoked');
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    console.error('delete-account failed', deleteError);
    return jsonResponse(500, { code: 'DELETE_FAILED', message: '계정 삭제에 실패했습니다.' });
  }

  return jsonResponse(200, { deleted: true });
}
