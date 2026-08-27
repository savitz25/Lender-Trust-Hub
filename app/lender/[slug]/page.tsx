import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/directory/JsonLd';
import { NationalLenderProfile } from '@/components/national-profile/national-lender-profile';
import { NATIONAL_PROFILE_COHORT, getCohortBySlug } from '@/lib/national-profile/cohort';
import { fetchNationalProfile } from '@/lib/national-profile/fetch';
import { buildNationalProfileJsonLd } from '@/lib/national-profile/jsonld';
import {
  nationalProfileCanonical,
  nationalProfileDescription,
  nationalProfileRobots,
  nationalProfileTitle,
} from '@/lib/national-profile/seo';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return NATIONAL_PROFILE_COHORT.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCohortBySlug(slug);
  if (!entry) return { title: 'Lender research not found', robots: nationalProfileRobots() };
  const title = nationalProfileTitle(entry.displayName);
  const description = nationalProfileDescription(entry.displayName);
  return {
    title,
    description,
    robots: nationalProfileRobots(),
    alternates: { canonical: nationalProfileCanonical(slug) },
    openGraph: { title, description, url: nationalProfileCanonical(slug) },
  };
}

export default async function NationalLenderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchNationalProfile(slug);
  if (!result) notFound();

  const jsonLd = buildNationalProfileJsonLd({
    name: result.profile.identity.display_name || result.profile.identity.canonical_name,
    slug,
    identifiers: result.profile.identity.identifiers,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <NationalLenderProfile
        entry={result.entry}
        profile={result.profile}
        fetchSource={result.source}
        fetchMs={result.fetchMs}
      />
    </>
  );
}
