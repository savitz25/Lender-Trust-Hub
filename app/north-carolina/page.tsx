import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  NorthCarolinaStateIntelligence,
  NorthCarolinaStateIntelligenceUnavailable,
} from '@/components/north-carolina/north-carolina-state-intelligence';
import { buildNorthCarolinaIntelligenceJsonLd } from '@/lib/north-carolina-intelligence/jsonld';
import { loadNorthCarolinaIntelligence } from '@/lib/north-carolina-intelligence/load';
import { NORTH_CAROLINA_INTELLIGENCE_GATE } from '@/lib/north-carolina-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${NORTH_CAROLINA_INTELLIGENCE_GATE.path}`;
  const robots = NORTH_CAROLINA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: NORTH_CAROLINA_INTELLIGENCE_GATE.title,
    description: NORTH_CAROLINA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: NORTH_CAROLINA_INTELLIGENCE_GATE.title,
      description: NORTH_CAROLINA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function NorthCarolinaIntelligencePage() {
  const loaded = await loadNorthCarolinaIntelligence();
  if (loaded.status !== 'ok') {
    return <NorthCarolinaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildNorthCarolinaIntelligenceJsonLd(loaded.snapshot)} />
      <NorthCarolinaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
