import { NextResponse } from 'next/server';
import { lenders } from '@/lib/lenders';
import { productionParentGate } from '@/lib/my-lending/one-click';
import { productionHandoffDeps, stageParentHandoff, type StageDeps } from '@/lib/my-lending/signed-handoff';
import type { HandoffIntent } from '@/lib/my-lending/handoff-form';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Production parent sync stays off. The canary constant is not an environment flag. */
export async function POST(request: Request) {
  const gate = productionParentGate();
  let slug = '';
  let intent: HandoffIntent = 'save';
  let pageOpen = false;
  let signedIn = false;
  let claimedNmls: string | null = null;
  let claimedReturnPath: string | null = null;
  let claimedEntityId: string | null = null;
  let claimedName: string | null = null;
  try {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.slug === 'string') slug = body.slug;
    if (body.intent === 'save' || body.intent === 'save_signin' || body.intent === 'unsave') intent = body.intent;
    pageOpen = body.pageOpen === true;
    signedIn = body.signedIn === true;
    if (typeof body.nmls === 'string') claimedNmls = body.nmls;
    if (typeof body.returnPath === 'string') claimedReturnPath = body.returnPath;
    if (typeof body.entityId === 'string') claimedEntityId = body.entityId;
    if (typeof body.name === 'string') claimedName = body.name;
  } catch {
    return NextResponse.json({ parentSync: 'off', state: 'local_only', broad: gate.broad, canary: gate.canary, watchCreated: false });
  }
  const deps: StageDeps = { catalog: lenders };
  if (gate.canary && !gate.broad) Object.assign(deps, productionHandoffDeps());
  const staged = await stageParentHandoff({
    slug, intent, pageOpen, signedIn, gate, claimedNmls, claimedReturnPath, claimedEntityId, claimedName,
  }, deps);
  if (staged.state !== 'continue') {
    return NextResponse.json({
      parentSync: 'off',
      state: 'local_only',
      reason: staged.reason,
      broad: gate.broad,
      canary: gate.canary,
      watchCreated: false,
    });
  }
  return NextResponse.json({
    parentSync: 'staged',
    state: 'continue',
    target: staged.target,
    continuationRef: staged.continuationRef,
    intent: staged.intent,
    broad: gate.broad,
    canary: gate.canary,
    watchCreated: false,
  });
}
