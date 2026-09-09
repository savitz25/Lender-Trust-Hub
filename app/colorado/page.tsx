import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  ColoradoStateIntelligence,
  ColoradoStateIntelligenceUnavailable,
} from '@/components/colorado/colorado-state-intelligence';
import { buildColoradoIntelligenceJsonLd } from '@/lib/colorado-intelligence/jsonld';
import { loadColoradoIntelligence } from '@/lib/colorado-intelligence/load';
import { COLORADO_INTELLIGENCE_GATE } from '@/lib/colorado-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${COLORADO_INTELLIGENCE_GATE.path}`;
  const robots = COLORADO_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: COLORADO_INTELLIGENCE_GATE.title,
    description: COLORADO_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: COLORADO_INTELLIGENCE_GATE.title,
      description: COLORADO_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function ColoradoIntelligencePage() {
  const loaded = await loadColoradoIntelligence();
  if (loaded.status !== 'ok') {
    return <ColoradoStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildColoradoIntelligenceJsonLd(loaded.snapshot)} />
      <ColoradoStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
