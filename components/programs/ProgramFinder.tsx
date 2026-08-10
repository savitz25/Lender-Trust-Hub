'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';
import {
  fitLevelLabel,
  getProgramById,
  scoreProgramFits,
  type FinderAnswers,
  type ProgramFitLevel,
} from '@/lib/programs';
import { ProgramDisclaimer } from '@/components/programs/ProgramDisclaimer';
import { cn } from '@/lib/utils';

const emptyAnswers: FinderAnswers = {
  firstTimeBuyer: '',
  militaryInterest: '',
  downPaymentComfort: '',
  purpose: '',
  stateSlug: '',
};

const inputClass =
  'w-full min-h-11 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-base text-[#0A2540] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 sm:text-sm';

function fitBadge(fit: ProgramFitLevel): string {
  switch (fit) {
    case 'often-discussed':
      return 'bg-emerald-100 text-emerald-900 ring-emerald-200';
    case 'sometimes-relevant':
      return 'bg-sky-100 text-sky-900 ring-sky-200';
    case 'less-common':
      return 'bg-zinc-100 text-zinc-700 ring-zinc-200';
    default:
      return 'bg-amber-50 text-amber-950 ring-amber-200';
  }
}

export function ProgramFinder({ initialStateSlug = '' }: { initialStateSlug?: string }) {
  const [answers, setAnswers] = useState<FinderAnswers>({
    ...emptyAnswers,
    stateSlug: initialStateSlug,
  });
  const [submitted, setSubmitted] = useState(false);

  const results = useMemo(
    () => (submitted ? scoreProgramFits(answers) : []),
    [submitted, answers]
  );

  function update<K extends keyof FinderAnswers>(key: K, value: FinderAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section
        aria-labelledby="pf-form-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Guided research · No application
          </p>
          <h2 id="pf-form-heading" className="mt-1 text-lg font-bold text-[#0A2540]">
            A few optional questions
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Answers never leave this page as a lead form. We only use them to rank educational
            program overviews—not to decide if you qualify.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <Field label="Are you a first-time homebuyer?" htmlFor="pf-ftb">
            <select
              id="pf-ftb"
              className={inputClass}
              value={answers.firstTimeBuyer}
              onChange={(e) =>
                update('firstTimeBuyer', e.target.value as FinderAnswers['firstTimeBuyer'])
              }
            >
              <option value="">Prefer not to say</option>
              <option value="yes">Yes / likely</option>
              <option value="no">No</option>
              <option value="unsure">Not sure</option>
            </select>
          </Field>

          <Field
            label="Interested in VA / military-related benefits?"
            htmlFor="pf-mil"
            hint="We do not verify service. This only surfaces VA education if relevant."
          >
            <select
              id="pf-mil"
              className={inputClass}
              value={answers.militaryInterest}
              onChange={(e) =>
                update('militaryInterest', e.target.value as FinderAnswers['militaryInterest'])
              }
            >
              <option value="">Prefer not to say</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="unsure">Not sure</option>
            </select>
          </Field>

          <Field label="Down payment cash comfort (rough)" htmlFor="pf-dp">
            <select
              id="pf-dp"
              className={inputClass}
              value={answers.downPaymentComfort}
              onChange={(e) =>
                update(
                  'downPaymentComfort',
                  e.target.value as FinderAnswers['downPaymentComfort']
                )
              }
            >
              <option value="">Not sure</option>
              <option value="under-3">Under ~3% of price</option>
              <option value="3-to-5">About 3–5%</option>
              <option value="5-to-20">About 5–20%</option>
              <option value="20-plus">About 20% or more</option>
              <option value="unsure">Unsure</option>
            </select>
          </Field>

          <Field label="Purchase or refinance?" htmlFor="pf-purpose">
            <select
              id="pf-purpose"
              className={inputClass}
              value={answers.purpose}
              onChange={(e) => update('purpose', e.target.value as FinderAnswers['purpose'])}
            >
              <option value="">Not sure</option>
              <option value="purchase">Purchase</option>
              <option value="refinance">Refinance</option>
              <option value="unsure">Unsure</option>
            </select>
          </Field>

          <Field
            label="State (optional, for DPA framing)"
            htmlFor="pf-state"
            hint="Helps point you to state housing finance themes—not a local program database."
          >
            <select
              id="pf-state"
              className={inputClass}
              value={answers.stateSlug}
              onChange={(e) => update('stateSlug', e.target.value)}
            >
              <option value="">Skip</option>
              <option value="florida">Florida</option>
              <option value="texas">Texas</option>
              <option value="georgia">Georgia</option>
              <option value="north-carolina">North Carolina</option>
              <option value="other">Other / multi-state</option>
            </select>
          </Field>

          <button
            type="submit"
            className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
          >
            Show educational program fits
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>

        <ProgramDisclaimer className="mt-5" />
      </section>

      <section aria-labelledby="pf-results-heading" className="space-y-4">
        <div className="rounded-2xl border border-[#0A2540]/15 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 p-5 shadow-sm md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Results · Not an approval
          </p>
          <h2 id="pf-results-heading" className="mt-1 text-xl font-bold text-[#0A2540]">
            {submitted ? 'Programs to research next' : 'Your program shortlist appears here'}
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            {submitted
              ? 'Ranked by educational relevance to your answers. Open each overview for down-payment themes, insurance concepts, and official sources.'
              : 'Answer any questions (or none) and continue. You can also browse all program pages without the quiz.'}
          </p>
        </div>

        {!submitted && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
            <p className="font-medium text-[#0A2540]">Or skip the quiz</p>
            <ul className="mt-3 space-y-2">
              {[
                ['/programs/fha', 'FHA loans'],
                ['/programs/va', 'VA loans'],
                ['/programs/conventional', 'Conventional loans'],
                ['/programs/down-payment-assistance', 'Down-payment assistance'],
                ['/programs/usda', 'USDA rural loans'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="font-semibold text-[#059669] hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {submitted &&
          results.map((r) => {
            const guide = getProgramById(r.programId);
            if (!guide) return null;
            return (
              <article
                key={r.programId}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#0A2540]">{guide.name}</h3>
                    <p className="mt-0.5 text-sm text-zinc-500">{guide.tagline}</p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                      fitBadge(r.fit)
                    )}
                  >
                    {fitLevelLabel(r.fit)}
                  </span>
                </div>
                <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
                  {r.reasons.map((reason) => (
                    <li key={reason} className="flex gap-2">
                      <Compass className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                  {r.caveats.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
                <Link
                  href={`/programs/${guide.slug}`}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <BookOpen className="h-4 w-4" aria-hidden />
                  Open {guide.shortName} overview
                </Link>
              </article>
            );
          })}

        {submitted && (
          <p className="text-center text-sm text-zinc-500">
            Next:{' '}
            <Link
              href="/tools/loan-estimate-analyzer"
              className="font-medium text-[#059669] hover:underline"
            >
              Analyze a Loan Estimate
            </Link>
            {' · '}
            <Link href="/local-lenders" className="font-medium text-[#059669] hover:underline">
              Browse lenders
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[#0A2540]">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
