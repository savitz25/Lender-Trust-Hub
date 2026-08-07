import { LenderHero } from '@/components/lender-hero';
import { LenderLandingSections } from '@/components/lender-landing-sections';

export default function HomePage() {
  return (
    <div>
      {/* Phase 2 — primary hero (Wealth & Finance research layer) */}
      <LenderHero />

      {/* Phase 3 — tools, how it works, trust, pathways, network */}
      <LenderLandingSections />
    </div>
  );
}
