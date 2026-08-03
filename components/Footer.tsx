import Link from 'next/link';
import { BrandLogoStacked } from '@/components/BrandLogo';
import { AskNetworkSeal } from '@/components/network/ask-network-seal';
import { LENDER_CONTACT_EMAIL } from '@/lib/network/ask-trust-hub';

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-[#0A2540] text-zinc-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4">
              <BrandLogoStacked className="opacity-95 brightness-0 invert" />
            </div>
            <p className="max-w-md text-sm leading-relaxed">
              Independent research directory of mortgage lenders and brokers. Zero paid placements.
              Multi-source licensing and public-risk signals. Not a lender or broker.
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`mailto:${LENDER_CONTACT_EMAIL}`}
                className="underline underline-offset-2 hover:text-white"
              >
                {LENDER_CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/local-lenders" className="transition-colors hover:text-white">
                  Local Lenders
                </Link>
              </li>
              <li>
                <Link href="/fdic-insured-banks" className="transition-colors hover:text-white">
                  FDIC Banks by State
                </Link>
              </li>
              <li>
                <Link href="/calculators" className="transition-colors hover:text-white">
                  Calculators
                </Link>
              </li>
              <li>
                <Link href="/compare" className="transition-colors hover:text-white">
                  Compare Lenders
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="transition-colors hover:text-white">
                  Methodology
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  About &amp; Trust
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">
              Legal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="text-zinc-400">No paid placements</span>
              </li>
              <li>
                <span className="text-zinc-400">Not a lender or broker</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-zinc-500">
          Calculator estimates and close-time figures (when shown) are educational or editorial
          only. Actual rates, fees, terms, and approvals vary. Always re-verify on NMLS Consumer
          Access.
        </p>

        <div className="mt-8 border-t border-white/10 pt-8">
          <AskNetworkSeal />
        </div>

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} LenderTrustHub.com — Independent research · Expanding
          coverage · Zero paid placements
        </div>
      </div>
    </footer>
  );
}
