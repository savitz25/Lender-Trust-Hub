import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  TennesseeStateIntelligence,
  TennesseeStateIntelligenceUnavailable,
} from '@/components/tennessee/tennessee-state-intelligence';
import { buildTennesseeIntelligenceJsonLd } from '@/lib/tennessee-intelligence/jsonld';
import { loadTennesseeIntelligence } from '@/lib/tennessee-intelligence/load';
import { TENNESSEE_INTELLIGENCE_GATE } from '@/lib/tennessee-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${TENNESSEE_INTELLIGENCE_GATE.path}`;
  const robots = TENNESSEE_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: TENNESSEE_INTELLIGENCE_GATE.title,
    description: TENNESSEE_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: TENNESSEE_INTELLIGENCE_GATE.title,
      description: TENNESSEE_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function TennesseeIntelligencePage() {
  const loaded = await loadTennesseeIntelligence();
  if (loaded.status !== 'ok') {
    return <TennesseeStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildTennesseeIntelligenceJsonLd(loaded.snapshot)} />
      <TennesseeStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
