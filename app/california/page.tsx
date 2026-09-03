import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  CaliforniaStateIntelligence,
  CaliforniaStateIntelligenceUnavailable,
} from '@/components/california/california-state-intelligence';
import { buildCaliforniaIntelligenceJsonLd } from '@/lib/california-intelligence/jsonld';
import { loadCaliforniaIntelligence } from '@/lib/california-intelligence/load';
import { CALIFORNIA_INTELLIGENCE_GATE } from '@/lib/california-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${CALIFORNIA_INTELLIGENCE_GATE.path}`;
  const robots = CALIFORNIA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: CALIFORNIA_INTELLIGENCE_GATE.title,
    description: CALIFORNIA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: CALIFORNIA_INTELLIGENCE_GATE.title,
      description: CALIFORNIA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function CaliforniaIntelligencePage() {
  const loaded = await loadCaliforniaIntelligence();
  if (loaded.status !== 'ok') {
    return <CaliforniaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildCaliforniaIntelligenceJsonLd(loaded.snapshot)} />
      <CaliforniaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
