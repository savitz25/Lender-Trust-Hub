import { nationalIndexingSitemapLocs } from '@/lib/national-profile/publication';

/**
 * Bounded national lender sitemap. Manifest only — no CFPB/HMDA table scans.
 */
export const dynamic = 'force-static';

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function GET() {
  const locs = nationalIndexingSitemapLocs();
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs.map(
      (loc) =>
        `  <url><loc>${xmlEscape(loc)}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`
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
