// deno-lint-ignore no-explicit-any
type SupabaseClientLike = any;

export interface RateLimitConfig {
  guestDeviceLimit: number;
  guestIpLimit: number;
}

export async function fetchRateLimitConfig(client: SupabaseClientLike): Promise<RateLimitConfig> {
  const { data, error } = await client
    .from('rate_limit_config')
    .select('tier, daily_interview_messages')
    .in('tier', ['guest_device', 'guest_ip']);

  if (error) {
    throw new Error(`한도 설정 조회 실패: ${error.message}`);
  }

  const byTier = new Map<string, number>(
    (data as { tier: string; daily_interview_messages: number }[]).map((row) => [
      row.tier,
      row.daily_interview_messages,
    ]),
  );
  const guestDeviceLimit = byTier.get('guest_device');
  const guestIpLimit = byTier.get('guest_ip');

  if (guestDeviceLimit == null || guestIpLimit == null) {
    throw new Error('guest_device/guest_ip 한도 설정이 없습니다.');
  }

  return { guestDeviceLimit, guestIpLimit };
}

/** salt와 함께 해시해 원본 기기 ID/IP가 DB에 그대로 남지 않게 한다. */
export async function hashSubjectKey(rawValue: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${rawValue}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function extractClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown';
}
