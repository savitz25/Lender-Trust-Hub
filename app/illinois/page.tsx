import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  IllinoisStateIntelligence,
  IllinoisStateIntelligenceUnavailable,
} from '@/components/illinois/illinois-state-intelligence';
import { buildIllinoisIntelligenceJsonLd } from '@/lib/illinois-intelligence/jsonld';
import { loadIllinoisIntelligence } from '@/lib/illinois-intelligence/load';
import { ILLINOIS_INTELLIGENCE_GATE } from '@/lib/illinois-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${ILLINOIS_INTELLIGENCE_GATE.path}`;
  const robots = ILLINOIS_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: ILLINOIS_INTELLIGENCE_GATE.title,
    description: ILLINOIS_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: ILLINOIS_INTELLIGENCE_GATE.title,
      description: ILLINOIS_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function IllinoisIntelligencePage() {
  const loaded = await loadIllinoisIntelligence();
  if (loaded.status !== 'ok') {
    return <IllinoisStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildIllinoisIntelligenceJsonLd(loaded.snapshot)} />
      <IllinoisStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
