import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  ArizonaStateIntelligence,
  ArizonaStateIntelligenceUnavailable,
} from '@/components/arizona/arizona-state-intelligence';
import { buildArizonaIntelligenceJsonLd } from '@/lib/arizona-intelligence/jsonld';
import { loadArizonaIntelligence } from '@/lib/arizona-intelligence/load';
import { ARIZONA_INTELLIGENCE_GATE } from '@/lib/arizona-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${ARIZONA_INTELLIGENCE_GATE.path}`;
  const robots = ARIZONA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: ARIZONA_INTELLIGENCE_GATE.title,
    description: ARIZONA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: ARIZONA_INTELLIGENCE_GATE.title,
      description: ARIZONA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function ArizonaIntelligencePage() {
  const loaded = await loadArizonaIntelligence();
  if (loaded.status !== 'ok') {
    return <ArizonaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildArizonaIntelligenceJsonLd(loaded.snapshot)} />
      <ArizonaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
