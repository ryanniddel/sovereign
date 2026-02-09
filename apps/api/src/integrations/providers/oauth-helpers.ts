import { createHmac } from 'crypto';

const STATE_SECRET =
  process.env.OAUTH_STATE_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret';

interface OAuthState {
  userId: string;
  provider: string;
  ts: number;
}

/** Sign an OAuth state param so we can verify on callback */
export function signState(userId: string, provider: string): string {
  const payload: OAuthState = { userId, provider, ts: Date.now() };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', STATE_SECRET)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}

/** Verify and decode an OAuth state param */
export function verifyState(
  state: string,
): { userId: string; provider: string } | null {
  const dotIdx = state.indexOf('.');
  if (dotIdx === -1) return null;

  const data = state.slice(0, dotIdx);
  const sig = state.slice(dotIdx + 1);

  const expectedSig = createHmac('sha256', STATE_SECRET)
    .update(data)
    .digest('base64url');

  if (sig !== expectedSig) return null;

  try {
    const payload: OAuthState = JSON.parse(
      Buffer.from(data, 'base64url').toString('utf8'),
    );
    // Reject state older than 10 minutes
    if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
    return { userId: payload.userId, provider: payload.provider };
  } catch {
    return null;
  }
}

/** Exchange an authorization code for tokens (generic for all OAuth providers) */
export async function exchangeCode(
  tokenUrl: string,
  params: Record<string, string>,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  // Slack returns authed_user
  authed_user?: { access_token: string; scope: string; id: string };
}> {
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params).toString(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json();
}
