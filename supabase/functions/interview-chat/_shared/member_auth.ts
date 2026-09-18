// deno-lint-ignore no-explicit-any
type SupabaseClientLike = any;

export interface MemberUser {
  userId: string;
}

/**
 * `Authorization` 헤더 값만으로는 회원/비회원을 구분할 수 없다 — 비회원도 publishable key를
 * `Authorization: Bearer`로 보낸다. `auth.getUser(jwt)`로 실제 검증해서 회원만 골라낸다.
 */
export async function resolveMemberUser(
  req: Request,
  client: SupabaseClientLike,
): Promise<MemberUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return null;
  }

  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }

  return { userId: data.user.id as string };
}
