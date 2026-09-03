import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { NewJerseyCountyIntelligence } from '@/components/new-jersey/new-jersey-county-intelligence';
import { SITE_URL } from '@/lib/directory/categories';
import {
  NJ_COUNTY_INTELLIGENCE_GATES,
  NJ_COUNTY_SNAPSHOTS,
  countyRobots,
  type NjCountySlug,
} from '@/lib/new-jersey-intelligence/counties';
import { buildNjCountyIntelligenceJsonLd } from '@/lib/new-jersey-intelligence/counties/jsonld';

export function generateNjCountyMetadata(slug: NjCountySlug): Metadata {
  const gate = NJ_COUNTY_INTELLIGENCE_GATES[slug];
  const robots = countyRobots(slug);
  const url = `${SITE_URL}${gate.path}`;
  return {
    title: gate.title,
    description: gate.description,
    robots: robots.index
      ? { index: true, follow: true }
      : { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: url },
    openGraph: {
      title: gate.title,
      description: gate.description,
      url,
    },
  };
}

export function NewJerseyCountyPage({ slug }: { slug: NjCountySlug }) {
  const snapshot = NJ_COUNTY_SNAPSHOTS[slug];
  return (
    <>
      <JsonLd data={buildNjCountyIntelligenceJsonLd(snapshot)} />
      <NewJerseyCountyIntelligence snapshot={snapshot} />
    </>
  );
}
