import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  NewYorkStateIntelligence,
  NewYorkStateIntelligenceUnavailable,
} from '@/components/new-york/new-york-state-intelligence';
import { buildNewYorkIntelligenceJsonLd } from '@/lib/new-york-intelligence/jsonld';
import { loadNewYorkIntelligence } from '@/lib/new-york-intelligence/load';
import { NEW_YORK_INTELLIGENCE_GATE } from '@/lib/new-york-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${NEW_YORK_INTELLIGENCE_GATE.path}`;
  const robots = NEW_YORK_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: NEW_YORK_INTELLIGENCE_GATE.title,
    description: NEW_YORK_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: NEW_YORK_INTELLIGENCE_GATE.title,
      description: NEW_YORK_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function NewYorkIntelligencePage() {
  const loaded = await loadNewYorkIntelligence();
  if (loaded.status !== 'ok') {
    return <NewYorkStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildNewYorkIntelligenceJsonLd(loaded.snapshot)} />
      <NewYorkStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
