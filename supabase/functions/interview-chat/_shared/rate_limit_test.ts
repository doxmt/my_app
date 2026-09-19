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
