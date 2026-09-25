import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  NevadaStateIntelligence,
  NevadaStateIntelligenceUnavailable,
} from '@/components/nevada/nevada-state-intelligence';
import { buildNevadaIntelligenceJsonLd } from '@/lib/nevada-intelligence/jsonld';
import { loadNevadaIntelligence } from '@/lib/nevada-intelligence/load';
import { NEVADA_INTELLIGENCE_GATE } from '@/lib/nevada-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${NEVADA_INTELLIGENCE_GATE.path}`;
  const robots = NEVADA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: NEVADA_INTELLIGENCE_GATE.title,
    description: NEVADA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: NEVADA_INTELLIGENCE_GATE.title,
      description: NEVADA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function NevadaIntelligencePage() {
  const loaded = await loadNevadaIntelligence();
  if (loaded.status !== 'ok') {
    return <NevadaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildNevadaIntelligenceJsonLd(loaded.snapshot)} />
      <NevadaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
