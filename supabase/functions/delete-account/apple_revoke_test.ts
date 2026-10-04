import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { type AppleConfig, createClientSecret, revokeAppleToken } from './apple_revoke.ts';

async function testConfig(): Promise<{ config: AppleConfig; publicKey: CryptoKey }> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  const b64 = btoa(String.fromCharCode(...der)).replace(/(.{64})/g, '$1\n');
  return {
    config: {
      teamId: 'TEAM123456',
      keyId: 'KEY1234567',
      clientId: 'com.example.app',
      privateKeyPem: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`,
    },
    publicKey: pair.publicKey,
  };
}

function decodePart(part: string) {
  return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
}

function fakeFetch(responses: Record<string, Response>) {
  const calls: { url: string; body: URLSearchParams }[] = [];
  const fetchFn = ((url: string, init: RequestInit) => {
    calls.push({ url, body: init.body as URLSearchParams });
    return Promise.resolve(responses[url]);
  }) as unknown as typeof fetch;
  return { fetchFn, calls };
}

Deno.test('client_secret은 Apple 형식의 ES256 JWT이고 서명이 검증된다', async () => {
  const { config, publicKey } = await testConfig();

  const jwt = await createClientSecret(config, 1_000);
  const [header, payload, signature] = jwt.split('.');

  assertEquals(decodePart(header), { alg: 'ES256', kid: 'KEY1234567' });
  assertEquals(decodePart(payload), {
    iss: 'TEAM123456',
    iat: 1_000,
    exp: 1_300,
    aud: 'https://appleid.apple.com',
    sub: 'com.example.app',
  });
  const binary = atob(signature.replace(/-/g, '+').replace(/_/g, '/'));
  const sig = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    sig[i] = binary.charCodeAt(i);
  }
  assert(
    await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      sig,
      new TextEncoder().encode(`${header}.${payload}`),
    ),
  );
});

Deno.test('줄바꿈이 \\n 문자열로 들어간 키도 읽는다', async () => {
  const { config } = await testConfig();

  const jwt = await createClientSecret({ ...config, privateKeyPem: config.privateKeyPem.replace(/\n/g, '\\n') }, 1);

  assertEquals(jwt.split('.').length, 3);
});

Deno.test('코드를 refresh token으로 바꾼 뒤 그 토큰을 철회한다', async () => {
  const { config } = await testConfig();
  const { fetchFn, calls } = fakeFetch({
    'https://appleid.apple.com/auth/token': Response.json({ refresh_token: 'refresh-1' }),
    'https://appleid.apple.com/auth/revoke': new Response(null, { status: 200 }),
  });

  await revokeAppleToken(config, 'code-1', fetchFn);

  assertEquals(calls.map((c) => c.url), [
    'https://appleid.apple.com/auth/token',
    'https://appleid.apple.com/auth/revoke',
  ]);
  assertEquals(calls[0].body.get('grant_type'), 'authorization_code');
  assertEquals(calls[0].body.get('code'), 'code-1');
  assertEquals(calls[0].body.get('client_id'), 'com.example.app');
  assertEquals(calls[1].body.get('token'), 'refresh-1');
  assertEquals(calls[1].body.get('token_type_hint'), 'refresh_token');
});

Deno.test('코드 교환이 실패하면 예외를 던지고 철회를 호출하지 않는다', async () => {
  const { config } = await testConfig();
  const { fetchFn, calls } = fakeFetch({
    'https://appleid.apple.com/auth/token': Response.json({ error: 'invalid_grant' }, { status: 400 }),
  });

  await assertRejects(() => revokeAppleToken(config, 'bad-code', fetchFn));
  assertEquals(calls.length, 1);
});

Deno.test('철회가 실패하면 예외를 던진다', async () => {
  const { config } = await testConfig();
  const { fetchFn } = fakeFetch({
    'https://appleid.apple.com/auth/token': Response.json({ refresh_token: 'refresh-1' }),
    'https://appleid.apple.com/auth/revoke': new Response('error', { status: 400 }),
  });

  await assertRejects(() => revokeAppleToken(config, 'code-1', fetchFn));
});
