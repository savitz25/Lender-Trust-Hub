import { LenderHero } from '@/components/lender-hero';
import { LenderLandingSections } from '@/components/lender-landing-sections';
import { JsonLd } from '@/components/directory/JsonLd';
import { buildLenderHomepageGraph } from '@/lib/seo/organization';

export default function HomePage() {
  return (
    <div>
      <JsonLd data={buildLenderHomepageGraph()} />
      {/* Phase 2 — primary hero (Wealth & Finance research layer) */}
      <LenderHero />

      {/* Phase 3 — tools, how it works, trust, pathways, network */}
      <LenderLandingSections />
    </div>
  );
}
