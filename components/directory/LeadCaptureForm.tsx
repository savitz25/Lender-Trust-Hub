'use client';

import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { trackDirectoryEvent } from '@/lib/directory/analytics';

type LeadCategory = 'fdic' | 'mortgage' | 'auto' | 'credit-repair' | 'mca';
type LeadVariant = 'default' | 'hero-compact' | 'sidebar-minimal' | 'state-page-v2';

const COPY: Record<
  LeadCategory,
  { headline: (state: string) => string; sub: (state: string) => string; intent: string; cta: string }
> = {
  fdic: {
    headline: (s) => `Get the ${s} Banking Guide`,
    sub: (s) =>
      `Free FDIC verification checklist, deposit insurance tips, and mortgage calculator links — tailored for ${s} residents.`,
    intent: 'banking_guide',
    cta: 'Send Guide',
  },
  mortgage: {
    headline: (s) => `Get ${s} Mortgage Lender Insights`,
    sub: (s) =>
      `NMLS verification tips, county lender comparisons, and free calculator access for ${s} homebuyers.`,
    intent: 'mortgage_guide',
    cta: 'Get Insights',
  },
  auto: {
    headline: (s) => `Get ${s} Auto Loan Rate Alerts`,
    sub: (s) =>
      `APR comparison tips, bad credit financing guides, and lender trust score updates for ${s} drivers.`,
    intent: 'auto_guide',
    cta: 'Get Rate Alerts',
  },
  'credit-repair': {
    headline: (s) => `Get ${s} Credit Repair Checklist`,
    sub: (s) =>
      `Legitimate service red flags, dispute letter templates, and verified company updates for ${s}.`,
    intent: 'credit_repair_guide',
    cta: 'Get Checklist',
  },
  mca: {
    headline: (s) => `Get ${s} MCA Comparison Guide`,
    sub: (s) =>
      `Factor rate explainers, holdback calculators, and verified MCA company updates for ${s} businesses.`,
    intent: 'mca_guide',
    cta: 'Get Guide',
  },
};

export function LeadCaptureForm({
  stateName,
  categoryId = 'fdic',
  variant = 'default',
}: {
  stateName: string;
  categoryId?: LeadCategory;
  /** A/B-friendly variant id — wire to GA4 via data-variant attribute */
  variant?: LeadVariant;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const copy = COPY[categoryId];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);

    trackDirectoryEvent({
      name: 'directory_lead_submit',
      category: categoryId,
      state: stateName,
      intent: copy.intent,
    });

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          category: categoryId,
          stateName,
          intent: copy.intent,
          source: 'lead_capture_form',
          variant,
        }),
      });
    } catch {
      /* Non-blocking — user still sees success; logs in Supabase when available */
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-[#00A3A1]/30 bg-[#00A3A1]/5 p-6 text-center"
        data-variant={variant}
        data-category={categoryId}
      >
        <p className="font-semibold text-[#0A2540]">You&apos;re on the list!</p>
        <p className="mt-1 text-sm text-zinc-600">
          We&apos;ll send {stateName} lending insights and calculator updates. No spam — ever.
        </p>
      </div>
    );
  }

  // sidebar-minimal — light card for sidebars
  if (variant === 'sidebar-minimal') {
    return (
      <section
        aria-labelledby="lead-capture-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-5"
        data-variant={variant}
        data-category={categoryId}
      >
        <h2 id="lead-capture-heading" className="text-sm font-bold text-[#0A2540]">
          {copy.headline(stateName)}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">{copy.sub(stateName)}</p>
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          <label htmlFor="lead-email-minimal" className="sr-only">
            Email address
          </label>
          <input
            id="lead-email-minimal"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-[#0A2540] focus:ring-2 focus:ring-[#00A3A1]"
            autoComplete="email"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-[#00A3A1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#008f8d]"
          >
            {copy.cta}
          </button>
        </form>
      </section>
    );
  }

  // hero-compact — inline strip for hub pages
  if (variant === 'hero-compact') {
    return (
      <section
        aria-labelledby="lead-capture-heading"
        className="rounded-2xl border border-[#0A2540]/10 bg-white p-6 shadow-sm"
        data-variant={variant}
        data-category={categoryId}
      >
        <h2 id="lead-capture-heading" className="text-lg font-bold text-[#0A2540]">
          {copy.headline(stateName)}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">{copy.sub(stateName)}</p>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="lead-email-compact" className="sr-only">
            Email address
          </label>
          <input
            id="lead-email-compact"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-[#0A2540] focus:ring-2 focus:ring-[#00A3A1]"
            autoComplete="email"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0d3a5c]"
          >
            {copy.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
        <p className="mt-2 text-xs text-zinc-400">No paid placements. Unsubscribe anytime.</p>
      </section>
    );
  }

  // default + state-page-v2 — full dark gradient card
  const isV2 = variant === 'state-page-v2';

  return (
    <section
      aria-labelledby="lead-capture-heading"
      className={`rounded-2xl border text-white md:p-8 ${
        isV2
          ? 'border-[#00A3A1]/20 bg-gradient-to-br from-[#0A2540] via-[#0d3a5c] to-[#0A2540] p-6 ring-1 ring-[#00A3A1]/10'
          : 'border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] p-6'
      }`}
      data-variant={variant}
      data-category={categoryId}
    >
      <div className="flex items-start gap-3">
        <Mail className="mt-1 h-6 w-6 shrink-0 text-[#7ee8e6]" aria-hidden="true" />
        <div className="flex-1">
          <h2 id="lead-capture-heading" className="text-lg font-bold md:text-xl">
            {copy.headline(stateName)}
          </h2>
          <p className="mt-2 text-sm text-zinc-300">{copy.sub(stateName)}</p>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="lead-email" className="sr-only">
              Email address
            </label>
            <input
              id="lead-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="flex-1 rounded-xl border-0 px-4 py-3 text-[#0A2540] focus:ring-2 focus:ring-[#00A3A1]"
              autoComplete="email"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00A3A1] px-5 py-3 text-sm font-semibold hover:bg-[#008f8d]"
            >
              {copy.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-2 text-xs text-zinc-400">No paid placements. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}