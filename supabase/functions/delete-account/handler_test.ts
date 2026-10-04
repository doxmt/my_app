import { assertEquals } from 'jsr:@std/assert@1';
import { handleDeleteAccount } from './handler.ts';

function fakeClient(options: { userId?: string | null; deleteError?: unknown; providers?: string[] }) {
  const deleted: string[] = [];
  const client = {
    auth: {
      getUser: async (_token: string) =>
        options.userId
          ? {
            data: { user: { id: options.userId, app_metadata: { providers: options.providers ?? ['kakao'] } } },
            error: null,
          }
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

const appleHeaders = { authorization: 'Bearer valid-jwt', 'content-type': 'application/json' };

Deno.test('Apple 회원은 토큰을 철회한 뒤 삭제한다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1', providers: ['apple'] });
  const codes: string[] = [];

  const res = await handleDeleteAccount(
    post(appleHeaders, { appleAuthorizationCode: 'code-1' }),
    client,
    async (code) => {
      codes.push(code);
    },
  );

  assertEquals(res.status, 200);
  assertEquals(codes, ['code-1']);
  assertEquals(deleted, ['user-1']);
});

Deno.test('Apple 회원인데 authorizationCode가 없으면 400이고 지우지 않는다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1', providers: ['github', 'apple'] });

  const res = await handleDeleteAccount(post({ authorization: 'Bearer valid-jwt' }), client, async () => {});

  assertEquals(res.status, 400);
  assertEquals(deleted, []);
});

Deno.test('Apple 철회가 실패하면 502이고 지우지 않는다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1', providers: ['apple'] });

  const res = await handleDeleteAccount(
    post(appleHeaders, { appleAuthorizationCode: 'code-1' }),
    client,
    () => Promise.reject(new Error('invalid_grant')),
  );

  assertEquals(res.status, 502);
  assertEquals(deleted, []);
});

Deno.test('Apple 설정이 없으면 Apple 회원은 500이고 지우지 않는다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1', providers: ['apple'] });

  const res = await handleDeleteAccount(post(appleHeaders, { appleAuthorizationCode: 'code-1' }), client, null);

  assertEquals(res.status, 500);
  assertEquals(deleted, []);
});

Deno.test('비Apple 회원은 철회 없이 삭제한다', async () => {
  const { client, deleted } = fakeClient({ userId: 'user-1', providers: ['kakao'] });
  let revoked = false;

  const res = await handleDeleteAccount(post({ authorization: 'Bearer valid-jwt' }), client, async () => {
    revoked = true;
  });

  assertEquals(res.status, 200);
  assertEquals(revoked, false);
  assertEquals(deleted, ['user-1']);
});
