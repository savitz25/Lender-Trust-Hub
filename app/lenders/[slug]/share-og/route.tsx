import { NextResponse } from 'next/server';
import { getLenderBySlug } from '@/lib/lenders';
import { lenderEntityShareModel } from '@/lib/seo/share-card-model';
import { renderLenderFallbackImage, renderLenderShareImage } from '@/lib/og/lender-share-card';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const lender = getLenderBySlug(decodeURIComponent(String(slug ?? '').trim()));
    if (!lender?.name) return renderLenderFallbackImage();
    return renderLenderShareImage(
      lenderEntityShareModel({
        name: lender.name,
        city: lender.city,
        state: lender.state,
        nmlsId: lender.nmlsId,
        type: lender.type,
      }),
    );
  } catch {
    return renderLenderFallbackImage();
  }
}

export function HEAD() {
  return new NextResponse(null, { status: 200, headers: { 'Content-Type': 'image/png' } });
}
