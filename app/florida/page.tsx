import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { FloridaStateIntelligence, FloridaStateIntelligenceUnavailable } from '@/components/florida/florida-state-intelligence';
import { buildFloridaIntelligenceJsonLd } from '@/lib/florida-intelligence/jsonld';
import { loadFloridaIntelligence } from '@/lib/florida-intelligence/load';
import { FLORIDA_INTELLIGENCE_GATE } from '@/lib/florida-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${FLORIDA_INTELLIGENCE_GATE.path}`;
  const robots = FLORIDA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: FLORIDA_INTELLIGENCE_GATE.title,
    description: FLORIDA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: FLORIDA_INTELLIGENCE_GATE.title,
      description: FLORIDA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function FloridaIntelligencePage() {
  const loaded = await loadFloridaIntelligence();
  if (loaded.status !== 'ok') {
    return <FloridaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildFloridaIntelligenceJsonLd(loaded.snapshot)} />
      <FloridaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
