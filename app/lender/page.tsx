import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { NationalLenderDiscovery } from '@/components/national-profile/national-lender-discovery';
import { buildNationalDiscoveryJsonLd } from '@/lib/national-profile/discovery-jsonld';
import { SITE_URL } from '@/lib/directory/categories';

const TITLE = 'National lender research';
const DESCRIPTION =
  'Search published lender research profiles by name or official identifier, including national public profiles and the current Florida public company cohort. Independent research. Not a ranking.';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = Boolean((sp.q && sp.q.trim()) || (sp.type && sp.type.trim()));
  if (filtered) {
    return {
      title: TITLE,
      description: DESCRIPTION,
      robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
      alternates: { canonical: `${SITE_URL}/lender` },
    };
  }
  return {
    title: TITLE,
    description: DESCRIPTION,
    robots: { index: true, follow: true },
    alternates: { canonical: `${SITE_URL}/lender` },
    openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/lender` },
  };
}

export default async function NationalLenderIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const query = typeof sp.q === 'string' ? sp.q : '';
  const type = typeof sp.type === 'string' ? sp.type : '';
  const filtered = Boolean(query.trim() || type.trim());

  return (
    <>
      {filtered ? null : <JsonLd data={buildNationalDiscoveryJsonLd()} />}
      <NationalLenderDiscovery query={query} type={type} />
    </>
  );
}
