import Link from 'next/link';
import { BrandLogoStacked } from '@/components/BrandLogo';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-[#0A2540] text-zinc-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4">
              <BrandLogoStacked className="brightness-0 invert opacity-95" />
            </div>
            <p className="max-w-md text-sm leading-relaxed">
              Independent, data-obsessed directory of mortgage lenders and brokers.
              Zero paid placements. Multi-source verification from NMLS, CFPB, BBB,
              Google, and Trustpilot.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/local-lenders" className="hover:text-white transition-colors">Local Lenders</Link></li>
              <li><Link href="/fdic-insured-banks" className="hover:text-white transition-colors">FDIC Banks by State</Link></li>
              <li><Link href="/calculators" className="hover:text-white transition-colors">Calculators</Link></li>
              <li><a href="https://www.movetrusthub.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">MoveTrustHub</a></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Compare Lenders</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About & Trust</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-zinc-400">No paid placements</span></li>
              <li><span className="text-zinc-400">Not a lender or broker</span></li>
              <li><span className="text-zinc-400">Data for informational use</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} LenderTrustHub.com — Trusted Local Lenders • Verified County Insights • National Expertise
        </div>
      </div>
    </footer>
  );
}