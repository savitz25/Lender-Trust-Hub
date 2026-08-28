import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { FloridaStateIntelligence } from '@/components/florida/florida-state-intelligence';
import { buildFloridaIntelligenceJsonLd } from '@/lib/florida-intelligence/jsonld';
import { FLORIDA_INTELLIGENCE_GATE } from '@/lib/florida-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-static';

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

export default function FloridaIntelligencePage() {
  return (
    <>
      <JsonLd data={buildFloridaIntelligenceJsonLd()} />
      <FloridaStateIntelligence />
    </>
  );
}
