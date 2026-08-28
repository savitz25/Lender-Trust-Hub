import { SITE_URL } from '@/lib/directory/categories';
import { FLORIDA_PHASE1_GATE, FLORIDA_PHASE1_ROWS } from '@/lib/florida-profile/phase1';
import { nationalProfilePath } from '@/lib/national-profile/cohort';

export const dynamic = 'force-static';

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function GET() {
  const locs = FLORIDA_PHASE1_GATE.sitemap
    ? FLORIDA_PHASE1_ROWS.map((row) => `${SITE_URL}${nationalProfilePath(row.slug)}`)
    : [];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map(
      (loc) =>
        `  <url><loc>${xmlEscape(loc)}</loc><changefreq>monthly</changefreq><priority>0.55</priority></url>`
    ),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
