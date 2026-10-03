import { lenders } from '@/lib/lenders';
import type { AssertionKey, NonceStore } from '@/lib/my-lending/lender-assertion';
import { handleLenderSource } from '@/lib/my-lending/source-callback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const seen = new Map<string, number>();
const nonces: NonceStore = {
  async claim(key, expiresAt) {
    const now = Date.now();
    for (const [id, exp] of seen) if (exp <= now) seen.delete(id);
    if (seen.has(key)) return false;
    seen.set(key, expiresAt);
    return true;
  },
};

function askVerifyKey(): AssertionKey | null {
  const kid = process.env.MY_TRUSTHUB_V23_ASK_KEY_ID?.trim() ?? '';
  const pem = process.env.MY_TRUSTHUB_V23_ASK_VERIFY_PUBLIC_KEY_PEM ?? '';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(kid) || !pem.includes('PUBLIC KEY')) return null;
  return { kid, pem };
}

export async function POST(request: Request) {
  return handleLenderSource(request, { catalog: lenders, key: askVerifyKey(), nonces });
}
