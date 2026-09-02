import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  NewJerseyStateIntelligence,
  NewJerseyStateIntelligenceUnavailable,
} from '@/components/new-jersey/new-jersey-state-intelligence';
import { buildNewJerseyIntelligenceJsonLd } from '@/lib/new-jersey-intelligence/jsonld';
import { loadNewJerseyIntelligence } from '@/lib/new-jersey-intelligence/load';
import { NEW_JERSEY_INTELLIGENCE_GATE } from '@/lib/new-jersey-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${NEW_JERSEY_INTELLIGENCE_GATE.path}`;
  const robots = NEW_JERSEY_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: NEW_JERSEY_INTELLIGENCE_GATE.title,
    description: NEW_JERSEY_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: NEW_JERSEY_INTELLIGENCE_GATE.title,
      description: NEW_JERSEY_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function NewJerseyIntelligencePage() {
  const loaded = await loadNewJerseyIntelligence();
  if (loaded.status !== 'ok') {
    return <NewJerseyStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildNewJerseyIntelligenceJsonLd(loaded.snapshot)} />
      <NewJerseyStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
