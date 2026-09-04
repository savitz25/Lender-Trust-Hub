import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  TexasStateIntelligence,
  TexasStateIntelligenceUnavailable,
} from '@/components/texas/texas-state-intelligence';
import { buildTexasIntelligenceJsonLd } from '@/lib/texas-intelligence/jsonld';
import { loadTexasIntelligence } from '@/lib/texas-intelligence/load';
import { TEXAS_INTELLIGENCE_GATE } from '@/lib/texas-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${TEXAS_INTELLIGENCE_GATE.path}`;
  const robots = TEXAS_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: TEXAS_INTELLIGENCE_GATE.title,
    description: TEXAS_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: TEXAS_INTELLIGENCE_GATE.title,
      description: TEXAS_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function TexasIntelligencePage() {
  const loaded = await loadTexasIntelligence();
  if (loaded.status !== 'ok') {
    return <TexasStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildTexasIntelligenceJsonLd(loaded.snapshot)} />
      <TexasStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
