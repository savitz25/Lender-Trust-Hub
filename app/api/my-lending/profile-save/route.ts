import { NextResponse } from 'next/server';
import { productionParentGate } from '@/lib/my-lending/one-click';

/** Production handoff stays closed. The canary list is not consulted here. */
export async function POST() {
  const gate = productionParentGate();
  return NextResponse.json({
    parentSync: 'off',
    broad: gate.broad,
    canary: gate.canary,
    watchCreated: false,
  });
}
