import { NextResponse } from 'next/server';
import { executeAskQuery } from '@/lib/ask-lender/execute-query';
import { LENDER_ASK_CONTRACT } from '@/lib/ask-lender/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q) {
    return NextResponse.json({ error: 'Missing q', contract: LENDER_ASK_CONTRACT }, { status: 400 });
  }
  const page = Number(url.searchParams.get('page') || '1') || 1;
  const result = executeAskQuery({
    q,
    page,
    overrides: {
      action: url.searchParams.get('action'),
      loanType: url.searchParams.get('loanType'),
      geo: url.searchParams.get('geo'),
    },
  });
  return NextResponse.json({ contract: LENDER_ASK_CONTRACT, ...result });
}
