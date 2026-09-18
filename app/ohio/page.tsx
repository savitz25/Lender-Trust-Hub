import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  OhioStateIntelligence,
  OhioStateIntelligenceUnavailable,
} from '@/components/ohio/ohio-state-intelligence';
import { buildOhioIntelligenceJsonLd } from '@/lib/ohio-intelligence/jsonld';
import { loadOhioIntelligence } from '@/lib/ohio-intelligence/load';
import { OHIO_INTELLIGENCE_GATE } from '@/lib/ohio-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${OHIO_INTELLIGENCE_GATE.path}`;
  const robots = OHIO_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: OHIO_INTELLIGENCE_GATE.title,
    description: OHIO_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: OHIO_INTELLIGENCE_GATE.title,
      description: OHIO_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function OhioIntelligencePage() {
  const loaded = await loadOhioIntelligence();
  if (loaded.status !== 'ok') {
    return <OhioStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildOhioIntelligenceJsonLd(loaded.snapshot)} />
      <OhioStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
