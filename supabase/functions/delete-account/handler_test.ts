import { assertEquals } from 'jsr:@std/assert@1';
import { handleDeleteAccount } from './handler.ts';

function fakeClient(options: { userId?: string | null; deleteError?: unknown }) {
  const deleted: string[] = [];
  const client = {
    auth: {
      getUser: async (_token: string) =>
        options.userId
          ? { data: { user: { id: options.userId } }, error: null }
          : { data: { user: null }, error: new Error('invalid JWT') },
      admin: {
        deleteUser: async (id: string) => {
          deleted.push(id);
          return { error: options.deleteError ?? null };
        },
      },
    },
  };
  return { client, deleted };
}

function post(headers: Record<string, string> = {}, body?: unknown) {
  return new Request('https://example.com/delete-account', {
    method: 'POST',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

Deno.test('Authorization 헤더가 없으면 401이고 아무도 지우지 않는다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1' });

  const res = await handleDeleteAccount(post(), client);

  assertEquals(res.status, 401);
  assertEquals(deleted, []);
});

Deno.test('유효하지 않은 토큰(publishable key 등)이면 401이고 아무도 지우지 않는다', async () => {
  const { client, deleted } = fakeClient({ userId: null });

  const res = await handleDeleteAccount(post({ authorization: 'Bearer sb_publishable_xxx' }), client);

  assertEquals(res.status, 401);
  assertEquals(deleted, []);
});

Deno.test('본문에 다른 user_id를 넣어도 JWT의 사용자만 지운다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1' });

  const res = await handleDeleteAccount(
    post({ authorization: 'Bearer valid-jwt', 'content-type': 'application/json' }, {
      user_id: 'victim',
      userId: 'victim',
    }),
    client,
  );

  assertEquals(res.status, 200);
  assertEquals(await res.json(), { deleted: true });
  assertEquals(deleted, ['user-1']);
});

Deno.test('삭제가 실패하면 500을 돌려준다', async () => {
  const { client } = fakeClient({ userId: 'user-1', deleteError: new Error('boom') });

  const res = await handleDeleteAccount(post({ authorization: 'Bearer valid-jwt' }), client);

  assertEquals(res.status, 500);
});

Deno.test('POST가 아니면 405, OPTIONS는 CORS 사전 요청으로 204', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1' });

  const get = await handleDeleteAccount(
    new Request('https://example.com', { headers: { authorization: 'Bearer valid-jwt' } }),
    client,
  );
  const options = await handleDeleteAccount(new Request('https://example.com', { method: 'OPTIONS' }), client);

  assertEquals(get.status, 405);
  assertEquals(options.status, 204);
  assertEquals(deleted, []);
});
