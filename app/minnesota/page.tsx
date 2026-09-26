import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  MinnesotaStateIntelligence,
  MinnesotaStateIntelligenceUnavailable,
} from '@/components/minnesota/minnesota-state-intelligence';
import { buildMinnesotaIntelligenceJsonLd } from '@/lib/minnesota-intelligence/jsonld';
import { loadMinnesotaIntelligence } from '@/lib/minnesota-intelligence/load';
import { MINNESOTA_INTELLIGENCE_GATE } from '@/lib/minnesota-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${MINNESOTA_INTELLIGENCE_GATE.path}`;
  const robots = MINNESOTA_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: MINNESOTA_INTELLIGENCE_GATE.title,
    description: MINNESOTA_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: MINNESOTA_INTELLIGENCE_GATE.title,
      description: MINNESOTA_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function MinnesotaIntelligencePage() {
  const loaded = await loadMinnesotaIntelligence();
  if (loaded.status !== 'ok') {
    return <MinnesotaStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildMinnesotaIntelligenceJsonLd(loaded.snapshot)} />
      <MinnesotaStateIntelligence snapshot={loaded.snapshot} />
    </>
  );
}
