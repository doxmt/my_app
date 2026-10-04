const APPLE_AUDIENCE = 'https://appleid.apple.com';

export interface AppleConfig {
  teamId: string;
  keyId: string;
  /** 네이티브 앱은 번들 ID가 client_id다. */
  clientId: string;
  /** `.p8` 파일 내용(PEM, PKCS#8). */
  privateKeyPem: string;
}

/** secrets에 Apple 설정이 모두 있을 때만 돌려준다. 하나라도 없으면 null. */
export function readAppleConfig(): AppleConfig | null {
  const teamId = Deno.env.get('APPLE_TEAM_ID');
  const keyId = Deno.env.get('APPLE_KEY_ID');
  const clientId = Deno.env.get('APPLE_CLIENT_ID');
  const privateKeyPem = Deno.env.get('APPLE_PRIVATE_KEY');
  if (!teamId || !keyId || !clientId || !privateKeyPem) {
    return null;
  }
  return { teamId, keyId, clientId, privateKeyPem };
}

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToDer(pem: string): Uint8Array<ArrayBuffer> {
  // secret에 줄바꿈이 `\n` 문자열로 들어간 경우도 받는다.
  const binary = atob(pem.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, ''));
  const der = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    der[i] = binary.charCodeAt(i);
  }
  return der;
}

/** Apple REST API용 client_secret(ES256 JWT). 요청마다 새로 만들어 5분만 유효하게 한다. */
export async function createClientSecret(config: AppleConfig, nowSeconds: number): Promise<string> {
  const encoder = new TextEncoder();
  const header = base64Url(encoder.encode(JSON.stringify({ alg: 'ES256', kid: config.keyId })));
  const payload = base64Url(encoder.encode(JSON.stringify({
    iss: config.teamId,
    iat: nowSeconds,
    exp: nowSeconds + 300,
    aud: APPLE_AUDIENCE,
    sub: config.clientId,
  })));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(config.privateKeyPem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  // WebCrypto ECDSA 서명은 JWS가 요구하는 r||s 형식 그대로다.
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    encoder.encode(`${header}.${payload}`),
  );
  return `${header}.${payload}.${base64Url(new Uint8Array(signature))}`;
}

/**
 * 앱이 재인증으로 받은 authorizationCode를 refresh token으로 바꾼 뒤 철회한다.
 * 어느 단계든 실패하면 예외를 던진다.
 */
export async function revokeAppleToken(
  config: AppleConfig,
  authorizationCode: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const clientSecret = await createClientSecret(config, Math.floor(Date.now() / 1000));
  const form = (fields: Record<string, string>) => ({
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: clientSecret, ...fields }),
  });

  const tokenRes = await fetchFn(
    `${APPLE_AUDIENCE}/auth/token`,
    form({ grant_type: 'authorization_code', code: authorizationCode }),
  );
  if (!tokenRes.ok) {
    throw new Error(`apple token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }
  const refreshToken = (await tokenRes.json()).refresh_token;
  if (typeof refreshToken !== 'string' || !refreshToken) {
    throw new Error('apple token exchange returned no refresh_token');
  }

  const revokeRes = await fetchFn(
    `${APPLE_AUDIENCE}/auth/revoke`,
    form({ token: refreshToken, token_type_hint: 'refresh_token' }),
  );
  if (!revokeRes.ok) {
    throw new Error(`apple revoke failed: ${revokeRes.status} ${await revokeRes.text()}`);
  }
}
