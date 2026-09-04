import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  WashingtonStateIntelligence,
  WashingtonStateIntelligenceUnavailable,
} from '@/components/washington/washington-state-intelligence';
import { buildWashingtonIntelligenceJsonLd } from '@/lib/washington-intelligence/jsonld';
import { loadWashingtonIntelligence } from '@/lib/washington-intelligence/load';
import { WASHINGTON_INTELLIGENCE_GATE } from '@/lib/washington-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${WASHINGTON_INTELLIGENCE_GATE.path}`;
  const robots = WASHINGTON_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: WASHINGTON_INTELLIGENCE_GATE.title,
    description: WASHINGTON_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: WASHINGTON_INTELLIGENCE_GATE.title,
      description: WASHINGTON_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function WashingtonIntelligencePage() {
  const loaded = await loadWashingtonIntelligence();
  if (loaded.status !== 'ok') {
    return <WashingtonStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildWashingtonIntelligenceJsonLd(loaded.snapshot)} />
      <WashingtonStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
