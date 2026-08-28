import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { JsonLd } from '@/components/directory/JsonLd';
import { FloridaCompanyProfile } from '@/components/florida/florida-company-profile';
import { NationalLenderProfile } from '@/components/national-profile/national-lender-profile';
import { NATIONAL_PROFILE_COHORT, getCohortBySlug, nationalProfilePath } from '@/lib/national-profile/cohort';
import { fetchNationalProfile } from '@/lib/national-profile/fetch';
import { buildNationalProfileJsonLd } from '@/lib/national-profile/jsonld';
import { nationalPresentationName } from '@/lib/national-profile/discovery';
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
import { FLORIDA_PHASE1_ROWS, FLORIDA_PHASE1_GATE, getPhase1Row } from '@/lib/florida-profile/phase1';
import { FLORIDA_PHASE2_ROWS, FLORIDA_PHASE2_GATE, getPhase2Row } from '@/lib/florida-profile/phase2';
import { fetchPublicLenderProfile } from '@/lib/florida-profile/fetch-public';
import { buildFloridaCompanyJsonLd } from '@/lib/florida-profile/jsonld';

export const dynamic = 'force-dynamic';

const FLORIDA_NOINDEX = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
} as const;

export function generateStaticParams() {
  const national = NATIONAL_PROFILE_COHORT.map((row) => ({ slug: row.slug }));
  const florida = [
    ...FLORIDA_PHASE1_ROWS.map((row) => ({ slug: row.slug })),
    ...FLORIDA_PHASE2_ROWS.map((row) => ({ slug: row.slug })),
  ];
  return [...national, ...florida];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: raw } = await params;
  const slug = resolveNationalProfileSlug(raw);
  const entry = getCohortBySlug(slug);
  if (entry) {
    const result = await fetchNationalProfile(slug);
    if (!result) return { title: 'Lender research not found', robots: nationalProfileRobots() };
    const name =
      nationalPresentationName(result.profile.identity.canonical_name, result.profile.identity.display_name) ||
      entry.displayName;
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
  const phase1 = getPhase1Row(slug);
  const phase2 = getPhase2Row(slug);
  if (!phase1 && !phase2) return { title: 'Lender research not found', robots: nationalProfileRobots() };
  const pub = await fetchPublicLenderProfile(slug);
  if (!pub || pub.kind === 'national_only' || !pub.florida) {
    return { title: 'Lender research not found', robots: nationalProfileRobots() };
  }
  const title = nationalProfileTitle(pub.florida.name);
  const description = `Research ${pub.florida.name} using Florida OFR licensing and Regulatory & Enforcement History. Independent research. Not a ranking, score, or lending advice.`;
  const indexable = phase1 ? FLORIDA_PHASE1_GATE.robotsIndex : FLORIDA_PHASE2_GATE.robotsIndex;
  return {
    title,
    description,
    robots: indexable ? { index: true, follow: true } : FLORIDA_NOINDEX,
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

  if (getCohortBySlug(slug)) {
    const result = await fetchNationalProfile(slug);
    if (!result) notFound();
    const jsonLd = buildNationalProfileJsonLd({
      name: nationalPresentationName(result.profile.identity.canonical_name, result.profile.identity.display_name),
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

  const pub = await fetchPublicLenderProfile(slug);
  if (!pub || pub.kind === 'national_only' || !pub.florida) notFound();
  const jsonLd = buildFloridaCompanyJsonLd(pub.florida);
  return (
    <>
      <JsonLd data={jsonLd} />
      <FloridaCompanyProfile
        florida={pub.florida}
        national={pub.national ? { profile: pub.national.profile, fetchMs: pub.national.fetchMs } : null}
        fetchMs={pub.fetchMs}
      />
    </>
  );
}
