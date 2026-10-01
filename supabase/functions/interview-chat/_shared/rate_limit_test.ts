import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { fetchMemberLimit } from './rate_limit.ts';

function fakeClient(row: { daily_interview_messages: number } | null, error: unknown = null) {
  return {
    from: (_table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, _value: string) => ({
          single: async () => ({ data: row, error }),
        }),
      }),
    }),
  };
}

Deno.test('fetchMemberLimit은 free 티어의 daily_interview_messages를 돌려준다', async () => {
  const client = fakeClient({ daily_interview_messages: 12 });

  const limit = await fetchMemberLimit(client);

  assertEquals(limit, 12);
});

Deno.test('조회 실패 시 에러를 던진다', async () => {
  const client = fakeClient(null, new Error('boom'));

  await assertRejects(() => fetchMemberLimit(client), Error, '한도 설정 조회 실패');
});

// usage_overrides(계정별 한도)와 rate_limit_config(free 기본값)를 모두 흉내 내는 클라이언트.
function overrideClient(opts: {
  override?: { daily_interview_messages: number } | null;
  overrideError?: unknown;
  free?: { daily_interview_messages: number };
}) {
  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (column: string, _value: string) => {
          if (table === 'usage_overrides') {
            return {
              maybeSingle: async () => ({ data: opts.override ?? null, error: opts.overrideError ?? null }),
            };
          }
          if (table === 'rate_limit_config' && column === 'tier') {
            return { single: async () => ({ data: opts.free ?? { daily_interview_messages: 15 }, error: null }) };
          }
          throw new Error(`예상하지 못한 조회: ${table}.${column}`);
        },
      }),
    }),
  };
}

Deno.test('계정별 한도가 있으면 free 기본값 대신 그 값을 돌려준다', async () => {
  const client = overrideClient({ override: { daily_interview_messages: 100000 } });

  const limit = await fetchMemberLimit(client, 'user-1');

  assertEquals(limit, 100000);
});

Deno.test('계정별 한도가 없으면 free 기본값을 돌려준다', async () => {
  const client = overrideClient({ override: null, free: { daily_interview_messages: 15 } });

  const limit = await fetchMemberLimit(client, 'user-1');

  assertEquals(limit, 15);
});

Deno.test('userId 없이 부르면 계정별 한도를 조회하지 않고 free 기본값을 돌려준다', async () => {
  const client = overrideClient({ override: { daily_interview_messages: 100000 } });

  const limit = await fetchMemberLimit(client);

  assertEquals(limit, 15);
});

Deno.test('계정별 한도 조회가 실패하면 에러를 던진다(조용히 기본값으로 풀리지 않는다)', async () => {
  const client = overrideClient({ overrideError: new Error('boom') });

  await assertRejects(() => fetchMemberLimit(client, 'user-1'), Error, '계정별 한도 조회 실패');
});
