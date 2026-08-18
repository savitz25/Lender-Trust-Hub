import Link from 'next/link';
import { BrandLogoStacked } from '@/components/BrandLogo';
import { AskNetworkSeal } from '@/components/network/ask-network-seal';
import {
  LENDER_BRAND,
  LENDER_FOOTER_COLUMNS,
  LENDER_INDEPENDENCE_LINE,
  LENDER_NETWORK_LINKS,
} from '@/lib/design/lender-design-system';
import { LENDER_CONTACT_EMAIL } from '@/lib/network/ask-trust-hub';

/**
 * Lender footer — Phase 1: navy, network hubs, independence, legal.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t border-white/10 text-slate-200"
      style={{ backgroundColor: LENDER_BRAND.navy }}
    >
      <div className="container mx-auto px-4 py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-4">
            <div className="mb-4">
              <BrandLogoStacked />
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              Independent research directory of mortgage lenders and brokers. NMLS-oriented
              verification signals. Not a lender or broker — educational tools only.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">
              {LENDER_INDEPENDENCE_LINE}
            </p>
            <p className="mt-3 text-sm">
              <a
                href={`mailto:${LENDER_CONTACT_EMAIL}`}
                className="font-medium text-[#CCFBF1] underline-offset-2 hover:text-white hover:underline"
              >
                {LENDER_CONTACT_EMAIL}
              </a>
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Network
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {LENDER_NETWORK_LINKS.filter((hub) => hub.id !== 'lender').map((hub) => (
                <li key={hub.id}>
                  <a
                    href={hub.href}
                    className="transition-colors hover:text-white"
                    rel="noopener noreferrer"
                  >
                    {hub.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="https://www.asktrusthub.com/promise"
                  className="font-medium text-[#CCFBF1] transition-colors hover:text-white"
                  rel="noopener noreferrer"
                >
                  Independence Policy
                </a>
              </li>
            </ul>
          </div>

          {LENDER_FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-300">
                {col.links.map((item) => (
                  <li key={item.href}>
                    {'external' in item && item.external ? (
                      <a
                        href={item.href}
                        className="transition-colors hover:text-white"
                        rel="noopener noreferrer"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className="transition-colors hover:text-white">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-slate-400">
          Calculator estimates and close-time figures (when shown) are educational or editorial
          only. Actual rates, fees, terms, and approvals vary. Always re-verify on NMLS Consumer
          Access. Independent research — no paid placements, no lead fees.
        </p>

        <div className="mt-8 border-t border-white/10 pt-8">
          <AskNetworkSeal />
        </div>

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          © {year} LenderTrustHub.com — Independent national research directory · Zero paid
          placements
        </div>
      </div>
    </footer>
  );
}
