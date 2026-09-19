import { NextResponse } from 'next/server';
import { executeNameCandidates, type NameCandidatesRequest } from '@/lib/name-candidates/operation';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };

function respond(result: ReturnType<typeof executeNameCandidates>) {
  return NextResponse.json(result.body, { status: result.status, headers });
}

/** TH-SEARCH-R1-019C: institution name candidates. Read-only; the committed catalog only. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const input: NameCandidatesRequest = { operation: 'name_candidates', name: url.searchParams.get('name') ?? undefined };
  for (const key of ['page', 'limit'] as const) {
    const raw = url.searchParams.get(key);
    if (raw !== null) input[key] = /^\d{1,3}$/.test(raw) ? Number(raw) : raw;
  }
  return respond(executeNameCandidates(input));
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? '0') > 2048) return respond(executeNameCandidates({ name: undefined }));
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  return respond(executeNameCandidates(body as NameCandidatesRequest));
}
