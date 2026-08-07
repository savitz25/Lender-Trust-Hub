import Link from 'next/link';
import { ArrowRight, Calculator, Scale } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import {
  LENDER_BRAND,
  LENDER_HERO,
  LENDER_RADIUS,
  LENDER_SHADOW,
} from '@/lib/design/lender-design-system';

/**
 * Phase 2 — primary homepage hero.
 * Positions Lender Trust Hub as independent Wealth & Finance research.
 * Does not include site header/footer (Phase 1).
 */
export function LenderHero() {
  return (
    <section
      data-hub="lender"
      aria-labelledby="lender-hero-heading"
      className="relative overflow-hidden border-b"
      style={{
        borderColor: LENDER_BRAND.border,
        background: `linear-gradient(165deg, ${LENDER_BRAND.white} 0%, ${LENDER_BRAND.canvas} 48%, #F0FDFA 100%)`,
      }}
    >
      {/* Soft teal wash — very light */}
      <div
        className="pointer-events-none absolute -right-24 top-0 h-[28rem] w-[28rem] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: LENDER_BRAND.teal }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full opacity-[0.08] blur-3xl"
        style={{ background: LENDER_BRAND.forest }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
          {/* Copy column */}
          <div className="lg:col-span-6">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em] sm:text-xs"
              style={{ color: LENDER_BRAND.teal }}
            >
              {LENDER_HERO.eyebrow}
            </p>

            <h1
              id="lender-hero-heading"
              className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]"
              style={{ color: LENDER_BRAND.ink }}
            >
              {LENDER_HERO.headline}
            </h1>

            <p
              className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg"
              style={{ color: LENDER_BRAND.ink }}
            >
              {LENDER_HERO.support}
            </p>

            <p
              className="mt-3 text-sm font-medium leading-snug"
              style={{ color: LENDER_BRAND.navy }}
            >
              {LENDER_HERO.networkLine}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link href={LENDER_HERO.primaryCta.href} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="default"
                  className="h-12 w-full gap-2 px-7 shadow-[0_6px_20px_-6px_rgb(13_148_136_/_0.35)] sm:w-auto"
                >
                  {LENDER_HERO.primaryCta.label}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href={LENDER_HERO.secondaryCta.href} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full gap-2 border-2 border-[#0D9488] px-7 sm:w-auto"
                >
                  <Calculator className="h-4 w-4 text-[#0D9488]" aria-hidden />
                  {LENDER_HERO.secondaryCta.label}
                </Button>
              </Link>
            </div>

            {/* Trust chips */}
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Trust signals">
              {LENDER_HERO.chips.map((chip) => (
                <li
                  key={chip.id}
                  className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold sm:text-sm"
                  style={{
                    borderColor: LENDER_BRAND.border,
                    backgroundColor: LENDER_BRAND.white,
                    color: LENDER_BRAND.ink,
                    boxShadow: LENDER_SHADOW.soft,
                  }}
                >
                  <span
                    className="mr-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: LENDER_BRAND.teal }}
                    aria-hidden
                  />
                  {chip.label}
                </li>
              ))}
            </ul>

            <p
              className="mt-6 text-sm font-semibold tracking-wide"
              style={{ color: LENDER_BRAND.navy }}
            >
              {LENDER_HERO.philosophy}
              <span className="mx-2 font-normal opacity-40" aria-hidden>
                ·
              </span>
              <span style={{ color: LENDER_BRAND.teal }}>Finance wisely. Grow well.</span>
            </p>
          </div>

          {/* Visual + quick-start column */}
          <div className="relative lg:col-span-6">
            <FinanceVisual className="pointer-events-none absolute -right-4 -top-6 hidden h-40 w-40 opacity-90 sm:block lg:-right-2 lg:top-0 lg:h-48 lg:w-48" />

            <div
              className="relative border bg-white p-5 sm:p-7"
              style={{
                borderColor: LENDER_BRAND.border,
                borderRadius: LENDER_RADIUS.cardLg,
                boxShadow: LENDER_SHADOW.card,
              }}
            >
              <div className="mb-4 flex items-start gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: LENDER_BRAND.tealSoft, color: LENDER_BRAND.teal }}
                  aria-hidden
                >
                  <Scale className="h-5 w-5" />
                </span>
                <div>
                  <h2
                    className="text-base font-bold sm:text-lg"
                    style={{ color: LENDER_BRAND.ink }}
                  >
                    {LENDER_HERO.searchTitle}
                  </h2>
                  <p className="mt-0.5 text-sm" style={{ color: LENDER_BRAND.ink, opacity: 0.85 }}>
                    {LENDER_HERO.searchHint}
                  </p>
                </div>
              </div>

              <SearchBar />

              <p
                className="mt-4 border-t pt-4 text-xs leading-relaxed sm:text-sm"
                style={{ borderColor: LENDER_BRAND.border, color: LENDER_BRAND.ink }}
              >
                Research only — not a marketplace. We do not sell your information or collect lead
                fees.
              </p>
            </div>

            {/* Soft gold accent bar — sparingly */}
            <div
              className="absolute -bottom-1 left-6 right-6 h-0.5 rounded-full opacity-80 sm:left-10 sm:right-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${LENDER_BRAND.gold}, transparent)`,
              }}
              aria-hidden
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Abstract finance-appropriate geometry — light bars / nodes, not decorative noise */
function FinanceVisual({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="80" cy="80" r="72" stroke={LENDER_BRAND.teal} strokeOpacity="0.12" strokeWidth="1" />
      <circle cx="80" cy="80" r="52" stroke={LENDER_BRAND.teal} strokeOpacity="0.1" strokeWidth="1" />
      {/* Rising comparison bars */}
      <rect x="42" y="88" width="14" height="36" rx="3" fill={LENDER_BRAND.teal} fillOpacity="0.2" />
      <rect x="64" y="68" width="14" height="56" rx="3" fill={LENDER_BRAND.teal} fillOpacity="0.35" />
      <rect x="86" y="52" width="14" height="72" rx="3" fill={LENDER_BRAND.teal} fillOpacity="0.5" />
      <rect x="108" y="40" width="14" height="84" rx="3" fill={LENDER_BRAND.forest} fillOpacity="0.45" />
      {/* Node accents */}
      <circle cx="49" cy="84" r="3.5" fill={LENDER_BRAND.teal} fillOpacity="0.7" />
      <circle cx="71" cy="64" r="3.5" fill={LENDER_BRAND.teal} fillOpacity="0.8" />
      <circle cx="93" cy="48" r="3.5" fill={LENDER_BRAND.teal} />
      <circle cx="115" cy="36" r="4" fill={LENDER_BRAND.gold} fillOpacity="0.9" />
    </svg>
  );
}
