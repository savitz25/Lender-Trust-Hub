import { askInputFromParams } from '@/lib/ask-lender/request';
import { NextResponse } from 'next/server';
import { executeAskQuery } from '@/lib/ask-lender/execute-query';
import { LENDER_ASK_CONTRACT } from '@/lib/ask-lender/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string | string[]> = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    params[key] = values.length === 1 ? values[0] : values;
  }
  const result = executeAskQuery(askInputFromParams(params));
  const status = result.terminalState === 'INVALID' ? 400 : result.terminalState === 'UNAVAILABLE' ? 503 : 200;
  return NextResponse.json({ contract: LENDER_ASK_CONTRACT, ...result }, { status });
}
