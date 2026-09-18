import { assertEquals } from 'jsr:@std/assert@1';
import { resolveMemberUser } from './member_auth.ts';

function fakeClient(result: { data: { user: { id: string } | null }; error: unknown }) {
  return {
    auth: {
      // deno-lint-ignore no-explicit-any
      getUser: async (_token: string) => result,
    },
  };
}

Deno.test('Authorization 헤더가 없으면 null을 돌려준다 (비회원 경로로 분기)', async () => {
  const client = fakeClient({ data: { user: null }, error: null });
  const req = new Request('https://example.com');

  const result = await resolveMemberUser(req, client);

  assertEquals(result, null);
});

Deno.test('유효한 JWT면 회원 경로로 분기한다', async () => {
  const client = fakeClient({ data: { user: { id: 'user-1' } }, error: null });
  const req = new Request('https://example.com', {
    headers: { authorization: 'Bearer valid-jwt' },
  });

  const result = await resolveMemberUser(req, client);

  assertEquals(result, { userId: 'user-1' });
});

Deno.test('publishable key처럼 유효하지 않은 토큰이면 null을 돌려준다 (비회원 경로로 분기)', async () => {
  const client = fakeClient({ data: { user: null }, error: new Error('invalid JWT') });
  const req = new Request('https://example.com', {
    headers: { authorization: 'Bearer sb_publishable_xxx' },
  });

  const result = await resolveMemberUser(req, client);

  assertEquals(result, null);
});
