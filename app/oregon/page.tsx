import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  OregonStateIntelligence,
  OregonStateIntelligenceUnavailable,
} from '@/components/oregon/oregon-state-intelligence';
import { buildOregonIntelligenceJsonLd } from '@/lib/oregon-intelligence/jsonld';
import { loadOregonIntelligence } from '@/lib/oregon-intelligence/load';
import { OREGON_INTELLIGENCE_GATE } from '@/lib/oregon-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${OREGON_INTELLIGENCE_GATE.path}`;
  const robots = OREGON_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: OREGON_INTELLIGENCE_GATE.title,
    description: OREGON_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: OREGON_INTELLIGENCE_GATE.title,
      description: OREGON_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function OregonIntelligencePage() {
  const loaded = await loadOregonIntelligence();
  if (loaded.status !== 'ok') {
    return <OregonStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildOregonIntelligenceJsonLd(loaded.snapshot)} />
      <OregonStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
