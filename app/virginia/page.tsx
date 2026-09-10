import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  VirginiaStateIntelligence,
  VirginiaStateIntelligenceUnavailable,
} from '@/components/virginia/virginia-state-intelligence';
import { buildVirginiaIntelligenceJsonLd } from '@/lib/virginia-intelligence/jsonld';
import { loadVirginiaIntelligence } from '@/lib/virginia-intelligence/load';
import { VIRGINIA_INTELLIGENCE_GATE } from '@/lib/virginia-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${VIRGINIA_INTELLIGENCE_GATE.path}`;
  const robots = VIRGINIA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: VIRGINIA_INTELLIGENCE_GATE.title,
    description: VIRGINIA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: VIRGINIA_INTELLIGENCE_GATE.title,
      description: VIRGINIA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function VirginiaIntelligencePage() {
  const loaded = await loadVirginiaIntelligence();
  if (loaded.status !== 'ok') {
    return <VirginiaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildVirginiaIntelligenceJsonLd(loaded.snapshot)} />
      <VirginiaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
