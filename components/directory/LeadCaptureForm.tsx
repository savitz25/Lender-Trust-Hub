'use client';

import { useState } from 'react';
import { ArrowRight, Mail } from 'lucide-react';
import { trackDirectoryEvent } from '@/lib/directory/analytics';

export function LeadCaptureForm({
  stateName,
  categoryId = 'fdic',
  variant = 'default',
}: {
  stateName: string;
  categoryId?: string;
  /** A/B-friendly variant id — wire to analytics */
  variant?: string;
}) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    trackDirectoryEvent({
      name: 'directory_lead_submit',
      category: categoryId,
      state: stateName,
      intent: 'banking_guide',
    });
    setSubmitted(true);
    // Integrate: Mailchimp, ConvertKit, or Neon/Workers API endpoint
  }

  if (submitted) {
    return (
      <div
        className="rounded-2xl border border-[#00A3A1]/30 bg-[#00A3A1]/5 p-6 text-center"
        data-variant={variant}
      >
        <p className="font-semibold text-[#0A2540]">You&apos;re on the list!</p>
        <p className="mt-1 text-sm text-zinc-600">
          We&apos;ll send {stateName} banking insights and calculator updates. No spam — ever.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="lead-capture-heading"
      className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-[#0A2540] to-[#0d3a5c] p-6 text-white md:p-8"
      data-variant={variant}
    >
      <div className="flex items-start gap-3">
        <Mail className="mt-1 h-6 w-6 shrink-0 text-[#7ee8e6]" aria-hidden="true" />
        <div className="flex-1">
          <h2 id="lead-capture-heading" className="text-lg font-bold md:text-xl">
            Get the {stateName} Banking Guide
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Free FDIC verification checklist, deposit insurance tips, and links to mortgage
            calculators — tailored for {stateName} residents.
          </p>
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
              Send Guide <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
          <p className="mt-2 text-xs text-zinc-400">No paid placements. Unsubscribe anytime.</p>
        </div>
      </div>
    </section>
  );
}