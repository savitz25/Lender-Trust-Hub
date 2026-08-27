import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { JsonLd } from '@/components/directory/JsonLd';
import { NationalLenderProfile } from '@/components/national-profile/national-lender-profile';
import { NATIONAL_PROFILE_COHORT, getCohortBySlug, nationalProfilePath } from '@/lib/national-profile/cohort';
import { fetchNationalProfile } from '@/lib/national-profile/fetch';
import { buildNationalProfileJsonLd } from '@/lib/national-profile/jsonld';
import {
  isNationalIndexingSlug,
  resolveNationalProfileSlug,
} from '@/lib/national-profile/publication';
import {
  nationalProfileCanonical,
  nationalProfileDescriptionForSlug,
  nationalProfileRobots,
  nationalProfileRobotsForSlug,
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
  const { slug: raw } = await params;
  const slug = resolveNationalProfileSlug(raw);
  const entry = getCohortBySlug(slug);
  if (!entry) return { title: 'Lender research not found', robots: nationalProfileRobots() };
  const result = await fetchNationalProfile(slug);
  if (!result) return { title: 'Lender research not found', robots: nationalProfileRobots() };
  const name = result.profile.identity.display_name || result.profile.identity.canonical_name || entry.displayName;
  const title = nationalProfileTitle(name);
  const description = nationalProfileDescriptionForSlug(name, slug);
  return {
    title,
    description,
    robots: nationalProfileRobotsForSlug(slug),
    alternates: { canonical: nationalProfileCanonical(slug) },
    openGraph: { title, description, url: nationalProfileCanonical(slug) },
  };
}

export default async function NationalLenderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: raw } = await params;
  const slug = resolveNationalProfileSlug(raw);
  if (slug !== raw) redirect(nationalProfilePath(slug));

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
        indexable={isNationalIndexingSlug(slug)}
      />
    </>
  );
}
