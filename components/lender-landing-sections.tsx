import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Columns3,
  FileSearch,
  GitCompare,
  MapPin,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  LENDER_BRAND,
  LENDER_HOW_IT_WORKS,
  LENDER_NETWORK_LINKS,
  LENDER_NETWORK_SECTION,
  LENDER_PATHWAYS,
  LENDER_RADIUS,
  LENDER_SHADOW,
  LENDER_TOOLS,
  LENDER_TRUST,
} from '@/lib/design/lender-design-system';

const TOOL_ICONS = {
  compare: GitCompare,
  verify: ShieldCheck,
  calculators: Calculator,
  local: MapPin,
  'le-analyzer': FileSearch,
  'le-compare': Columns3,
  'florida-research': Scale,
  'new-jersey-research': Scale,
  'california-research': Scale,
} as const;

/**
 * Phase 3 — homepage sections below the hero.
 * Does not include header, footer, or hero.
 */
export function LenderLandingSections() {
  return (
    <div data-hub="lender">
      <ToolsSection />
      <HowItWorksSection />
      <TrustSection />
      <PathwaysSection />
      <NetworkSection />
    </div>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  support,
  children,
  background = LENDER_BRAND.white,
  dark = false,
}: {
  id: string;
  eyebrow: string;
  title: string;
  support: string;
  children: React.ReactNode;
  background?: string;
  dark?: boolean;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="border-b scroll-mt-24"
      style={{
        borderColor: dark ? 'rgb(255 255 255 / 0.08)' : LENDER_BRAND.border,
        backgroundColor: background,
      }}
    >
      <div className="lth-section-pad">
        <div className="max-w-2xl">
          <p
            className="text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: dark ? LENDER_BRAND.tealSoft : LENDER_BRAND.teal }}
          >
            {eyebrow}
          </p>
          <h2
            id={`${id}-heading`}
            className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl"
            style={{ color: dark ? LENDER_BRAND.white : LENDER_BRAND.ink }}
          >
            {title}
          </h2>
          <p
            className="mt-3 text-base leading-relaxed sm:mt-4 sm:text-lg"
            style={{ color: dark ? LENDER_BRAND.onNavySoft : LENDER_BRAND.ink }}
          >
            {support}
          </p>
        </div>
        {children}
      </div>
    </section>
  );
}

function ToolsSection() {
  return (
    <SectionShell
      id="tools"
      eyebrow={LENDER_TOOLS.eyebrow}
      title={LENDER_TOOLS.title}
      support={LENDER_TOOLS.support}
      background={LENDER_BRAND.canvas}
    >
      <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
        {LENDER_TOOLS.items.map((item) => {
          const Icon = TOOL_ICONS[item.id as keyof typeof TOOL_ICONS] ?? Scale;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex h-full min-h-[11rem] flex-col rounded-2xl border bg-white p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 sm:p-6"
                style={{
                  borderColor:
                    item.id === 'le-analyzer' || item.id === 'le-compare'
                      ? '#A7F3D0'
                      : LENDER_BRAND.border,
                  borderRadius: LENDER_RADIUS.cardLg,
                  boxShadow: LENDER_SHADOW.card,
                }}
              >
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: LENDER_BRAND.tealSoft, color: LENDER_BRAND.teal }}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold tracking-tight" style={{ color: LENDER_BRAND.ink }}>
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: LENDER_BRAND.ink }}>
                  {item.description}
                </p>
                <span
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
                  style={{ color: LENDER_BRAND.teal }}
                >
                  {item.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
}

function HowItWorksSection() {
  return (
    <SectionShell
      id="how-it-works"
      eyebrow={LENDER_HOW_IT_WORKS.eyebrow}
      title={LENDER_HOW_IT_WORKS.title}
      support={LENDER_HOW_IT_WORKS.support}
      background={LENDER_BRAND.white}
    >
      <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4">
        {LENDER_HOW_IT_WORKS.steps.map((item) => (
          <li
            key={item.step}
            className="flex h-full flex-col rounded-2xl border bg-white p-5 sm:p-6"
            style={{
              borderColor: LENDER_BRAND.border,
              borderRadius: LENDER_RADIUS.cardLg,
              boxShadow: LENDER_SHADOW.card,
            }}
          >
            <span
              className="text-2xl font-bold tabular-nums"
              style={{ color: LENDER_BRAND.teal, opacity: 0.45 }}
              aria-hidden
            >
              {item.step}
            </span>
            <h3 className="mt-3 text-base font-semibold tracking-tight" style={{ color: LENDER_BRAND.ink }}>
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: LENDER_BRAND.ink }}>
              {item.description}
            </p>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

function TrustSection() {
  return (
    <SectionShell
      id="trust"
      eyebrow={LENDER_TRUST.eyebrow}
      title={LENDER_TRUST.title}
      support={LENDER_TRUST.support}
      background={LENDER_BRAND.navy}
      dark
    >
      <ul className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
        {LENDER_TRUST.pillars.map((pillar) => (
          <li
            key={pillar.title}
            className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
          >
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0"
              style={{ color: LENDER_BRAND.teal }}
              aria-hidden
            />
            <div>
              <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: LENDER_BRAND.onNavySoft }}>
                {pillar.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
        <Link href={LENDER_TRUST.primaryCta.href} className="w-full sm:w-auto">
          <Button size="lg" className="min-h-12 w-full gap-2 sm:w-auto">
            {LENDER_TRUST.primaryCta.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
        <a
          href={LENDER_TRUST.secondaryCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
        >
          {LENDER_TRUST.secondaryCta.label}
          <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
        <Link
          href={LENDER_TRUST.tertiaryCta.href}
          className="inline-flex h-12 items-center justify-center px-2 text-sm font-semibold text-white/90 underline-offset-4 hover:text-white hover:underline"
        >
          {LENDER_TRUST.tertiaryCta.label}
        </Link>
      </div>

      <p className="mt-8 text-sm font-semibold tracking-wide text-white">
        {LENDER_TRUST.philosophy}
        <span className="mx-2 font-normal text-white/40" aria-hidden>
          ·
        </span>
        <span style={{ color: LENDER_BRAND.tealSoft }}>{LENDER_TRUST.tagline}</span>
      </p>
    </SectionShell>
  );
}

function PathwaysSection() {
  return (
    <SectionShell
      id="pathways"
      eyebrow={LENDER_PATHWAYS.eyebrow}
      title={LENDER_PATHWAYS.title}
      support={LENDER_PATHWAYS.support}
      background={LENDER_BRAND.canvas}
    >
      <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-3">
        {/* Markets */}
        <div
          className="rounded-2xl border bg-white p-5 sm:p-6"
          style={{
            borderColor: LENDER_BRAND.border,
            borderRadius: LENDER_RADIUS.cardLg,
            boxShadow: LENDER_SHADOW.card,
          }}
        >
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color: LENDER_BRAND.teal }} aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: LENDER_BRAND.navy }}>
              Local markets
            </h3>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {LENDER_PATHWAYS.markets.map((market) => (
              <li key={market.href}>
                <Link
                  href={market.href}
                  className="inline-flex min-h-11 items-center rounded-full border bg-white px-3.5 py-2 text-sm font-semibold transition-colors hover:border-[#0D9488]/40 hover:bg-[#CCFBF1]/50"
                  style={{ borderColor: LENDER_BRAND.border, color: LENDER_BRAND.ink }}
                >
                  {market.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/local-lenders"
            className="mt-5 inline-flex min-h-11 items-center gap-1 text-sm font-semibold"
            style={{ color: LENDER_BRAND.teal }}
          >
            All local lenders
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        {/* Goals */}
        <div
          className="rounded-2xl border bg-white p-5 sm:p-6"
          style={{
            borderColor: LENDER_BRAND.border,
            borderRadius: LENDER_RADIUS.cardLg,
            boxShadow: LENDER_SHADOW.card,
          }}
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4" style={{ color: LENDER_BRAND.teal }} aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: LENDER_BRAND.navy }}>
              Financing goals
            </h3>
          </div>
          <ul className="mt-4 space-y-2">
            {LENDER_PATHWAYS.goals.map((goal) => (
              <li key={goal.label}>
                <Link
                  href={goal.href}
                  title={goal.detail}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors hover:border-[#0D9488]/40 hover:bg-[#CCFBF1]/40"
                  style={{ borderColor: LENDER_BRAND.border, color: LENDER_BRAND.ink }}
                >
                  {goal.label}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: LENDER_BRAND.teal }} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick tools */}
        <div
          className="rounded-2xl border bg-white p-5 sm:p-6"
          style={{
            borderColor: LENDER_BRAND.border,
            borderRadius: LENDER_RADIUS.cardLg,
            boxShadow: LENDER_SHADOW.card,
          }}
        >
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4" style={{ color: LENDER_BRAND.teal }} aria-hidden />
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: LENDER_BRAND.navy }}>
              Quick links
            </h3>
          </div>
          <ul className="mt-4 space-y-2">
            {LENDER_PATHWAYS.tools.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href}
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-sm font-semibold transition-colors hover:border-[#0D9488]/40 hover:bg-[#CCFBF1]/40"
                  style={{ borderColor: LENDER_BRAND.border, color: LENDER_BRAND.ink }}
                >
                  {tool.label}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: LENDER_BRAND.teal }} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionShell>
  );
}

function NetworkSection() {
  return (
    <SectionShell
      id="network"
      eyebrow={LENDER_NETWORK_SECTION.eyebrow}
      title={LENDER_NETWORK_SECTION.title}
      support={LENDER_NETWORK_SECTION.support}
      background={LENDER_BRAND.white}
    >
      <ul className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3">
        {LENDER_NETWORK_LINKS.map((hub) => (
          <li key={hub.id}>
            <a
              href={hub.href}
              rel="noopener noreferrer"
              className="flex h-full flex-col rounded-2xl border bg-white p-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 hover:border-[#0D9488]/35 sm:p-6"
              style={{
                borderColor: LENDER_BRAND.border,
                borderRadius: LENDER_RADIUS.cardLg,
                boxShadow: LENDER_SHADOW.card,
              }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: LENDER_BRAND.teal }}
              >
                {hub.shortLabel}
              </p>
              <h3 className="mt-1 text-lg font-semibold tracking-tight" style={{ color: LENDER_BRAND.ink }}>
                {hub.label}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: LENDER_BRAND.ink }}>
                {hub.blurb}
              </p>
              <span
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold"
                style={{ color: LENDER_BRAND.teal }}
              >
                Visit hub
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm font-semibold" style={{ color: LENDER_BRAND.navy }}>
        {LENDER_NETWORK_SECTION.philosophy}
        <span className="mx-2 font-normal opacity-40" aria-hidden>
          ·
        </span>
        <span style={{ color: LENDER_BRAND.teal }}>Finance wisely. Grow well.</span>
      </p>
    </SectionShell>
  );
}
