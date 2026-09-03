import { renderLenderFallbackImage } from '@/lib/og/lender-share-card';

export const runtime = 'edge';
export const alt = 'Lender Trust Hub — Independent Lending Research';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const socialCardRevision = '20260903share004b-final';

export default function OpenGraphImage() { return renderLenderFallbackImage(); }
