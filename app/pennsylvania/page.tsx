import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  PennsylvaniaStateIntelligence,
  PennsylvaniaStateIntelligenceUnavailable,
} from '@/components/pennsylvania/pennsylvania-state-intelligence';
import { buildPennsylvaniaIntelligenceJsonLd } from '@/lib/pennsylvania-intelligence/jsonld';
import { loadPennsylvaniaIntelligence } from '@/lib/pennsylvania-intelligence/load';
import { PENNSYLVANIA_INTELLIGENCE_GATE } from '@/lib/pennsylvania-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${PENNSYLVANIA_INTELLIGENCE_GATE.path}`;
  const robots = PENNSYLVANIA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: PENNSYLVANIA_INTELLIGENCE_GATE.title,
    description: PENNSYLVANIA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: PENNSYLVANIA_INTELLIGENCE_GATE.title,
      description: PENNSYLVANIA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function PennsylvaniaIntelligencePage() {
  const loaded = await loadPennsylvaniaIntelligence();
  if (loaded.status !== 'ok') {
    return <PennsylvaniaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildPennsylvaniaIntelligenceJsonLd(loaded.snapshot)} />
      <PennsylvaniaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
