'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import {
  LOAN_FOCUS_OPTIONS,
  SETUP_SITUATION_OPTIONS,
  type LoanFocus,
} from '@/lib/my-lending/types';
import {
  createPlan,
  ensureActivePlan,
  getActivePlan,
  getLastSaveError,
  getLendersForPlan,
  upsertPlan,
} from '@/lib/my-lending/storage';
import { Button } from '@/components/ui/button';
import { TrustMark } from '@/components/network/trust-mark';
import { cn } from '@/lib/utils';

/**
 * Light guided financing plan setup — Phase C.
 * Default: updates active plan (does not wipe shortlist).
 */
export function GuidedPlanSetup() {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<string[]>([]);
  const [zip, setZip] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [situations, setSituations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [savedLabel, setSavedLabel] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAsNew, setCreateAsNew] = useState(false);
  const [hasShortlist, setHasShortlist] = useState(false);
  const [activeLabel, setActiveLabel] = useState('My financing research');

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      const active = ensureActivePlan({ label: 'My financing research' });
      setActiveLabel(active.label);
      setCustomLabel(active.label);
      setFocus(active.loanFocus ?? []);
      setZip(active.location?.zip ?? '');
      setStateCode(active.location?.state ?? '');
      setNotes(active.notes ?? '');
      const n = getLendersForPlan(active.id).length;
      setHasShortlist(n > 0);
      setCreateAsNew(n > 0);
    }, 0);
    return () => window.clearTimeout(initialize);
  }, []);

  const locationLabel = useMemo(() => {
    const parts = [zip, stateCode].filter(Boolean);
    return parts.join(' · ') || undefined;
  }, [zip, stateCode]);

  const suggestedLabel = useMemo(() => {
    if (customLabel.trim()) return customLabel.trim().slice(0, 80);
    if (focus.length > 0) {
      return `Financing plan · ${focus.slice(0, 3).join(', ')}${locationLabel ? ` · ${locationLabel}` : ''}`.slice(
        0,
        80
      );
    }
    if (locationLabel) return `Financing research · ${locationLabel}`.slice(0, 80);
    return 'My financing research';
  }, [customLabel, focus, locationLabel]);

  function toggleFocus(id: LoanFocus) {
    setFocus((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSituation(id: string) {
    setSituations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function finish() {
    setError(null);
    if (focus.length === 0) {
      setError('Select at least one loan focus.');
      return;
    }
    const situationNotes = situations
      .map((id) => SETUP_SITUATION_OPTIONS.find((c) => c.id === id)?.label)
      .filter(Boolean)
      .join('; ');
    const mergedNotes =
      [notes.trim(), situationNotes].filter(Boolean).join(' · ') || undefined;
    const label = suggestedLabel;
    if (createAsNew) {
      createPlan({
        label,
        loanFocus: focus,
        location: {
          zip: zip.trim() || undefined,
          state: stateCode.trim().toUpperCase().slice(0, 2) || undefined,
          label: locationLabel,
        },
        notes: mergedNotes,
        makeActive: true,
      });
    } else {
      const existing = getActivePlan() ?? ensureActivePlan();
      upsertPlan({
        id: existing.id,
        label,
        loanFocus: focus,
        location: {
          zip: zip.trim() || undefined,
          state: stateCode.trim().toUpperCase().slice(0, 2) || undefined,
          label: locationLabel,
        },
        notes: mergedNotes,
        status: 'active',
      });
    }
    const err = getLastSaveError();
    if (err) {
      setError(err);
      return;
    }
    setSavedLabel(label);
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center sm:p-8">
        <Check className="mx-auto h-10 w-10 text-emerald-700" aria-hidden />
        <h2 className="mt-3 text-xl font-semibold text-[#0A2540]">Plan ready</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Saved to <strong>{savedLabel}</strong>
          {createAsNew
            ? ' as a new plan (previous plan stays in All plans).'
            : '. Shortlist on this plan is unchanged.'}{' '}
          Next: shortlist lenders, run calculators, then open your report.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/my-lending">
            <Button variant="trust">Open My Lending</Button>
          </Link>
          <Link href="/my-lending/plans">
            <Button variant="outline">All plans</Button>
          </Link>
          <Link href="/my-lending/report">
            <Button variant="outline">View report</Button>
          </Link>
          <Link href="/local-lenders">
            <Button variant="outline">Browse lenders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 text-xs font-medium text-zinc-500">
        {['Focus', 'Where', 'Situation', 'Review'].map((label, i) => (
          <span
            key={label}
            className={cn(
              'rounded-full px-3 py-1',
              i === step
                ? 'bg-[#059669] text-white'
                : i < step
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-zinc-100'
            )}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {step === 0 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[#0A2540]">What are you researching?</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Select all that apply. Educational financing plan only — not a loan application.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {LOAN_FOCUS_OPTIONS.map((opt) => {
              const on = focus.includes(opt.id);
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => toggleFocus(opt.id)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold',
                      on
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    )}
                    aria-pressed={on}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[#0A2540]">Where are you researching?</h2>
          <p className="mt-1 text-sm text-zinc-600">Optional ZIP and state — helps label your plan.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="setup-zip" className="text-sm font-medium text-zinc-800">
                ZIP
              </label>
              <input
                id="setup-zip"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="78701"
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                inputMode="numeric"
              />
            </div>
            <div>
              <label htmlFor="setup-state" className="text-sm font-medium text-zinc-800">
                State
              </label>
              <input
                id="setup-state"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="TX"
                maxLength={2}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[#0A2540]">Situation (optional)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Context only — not underwriting and not a loan offer.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SETUP_SITUATION_OPTIONS.map((opt) => {
              const on = situations.includes(opt.id);
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => toggleSituation(opt.id)}
                    className={cn(
                      'inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold',
                      on
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-zinc-200 bg-white text-zinc-700'
                    )}
                    aria-pressed={on}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <label htmlFor="setup-notes" className="text-sm font-medium text-zinc-800">
              Notes
            </label>
            <textarea
              id="setup-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Optional research notes"
            />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-[#0A2540]">Review</h2>
          <div className="mt-4">
            <label htmlFor="setup-label" className="text-sm font-medium text-zinc-800">
              Plan label
            </label>
            <input
              id="setup-label"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value.slice(0, 80))}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              placeholder={suggestedLabel}
            />
            <p className="mt-1 text-xs text-zinc-500">Will save as: {suggestedLabel}</p>
          </div>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-medium text-zinc-500">Loan focus</dt>
              <dd className="text-[#0A2540]">
                {focus.length
                  ? focus
                      .map(
                        (id) => LOAN_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id
                      )
                      .join(' · ')
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Location</dt>
              <dd className="text-[#0A2540]">{locationLabel || 'Not set'}</dd>
            </div>
          </dl>
          <fieldset className="mt-5 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
            <legend className="px-1 text-sm font-semibold text-zinc-800">Save as</legend>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="save-mode"
                className="mt-1"
                checked={!createAsNew}
                onChange={() => setCreateAsNew(false)}
              />
              <span>
                <span className="font-medium text-[#0A2540]">Update current plan</span>
                <span className="block text-zinc-600">
                  {activeLabel}
                  {hasShortlist ? ' (keeps existing shortlist)' : ''}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="radio"
                name="save-mode"
                className="mt-1"
                checked={createAsNew}
                onChange={() => setCreateAsNew(true)}
              />
              <span>
                <span className="font-medium text-[#0A2540]">Create as new plan</span>
                <span className="block text-zinc-600">
                  Fresh shortlist; previous plan stays in All plans
                  {hasShortlist ? ' (recommended — you already have saves)' : ''}
                </span>
              </span>
            </label>
          </fieldset>
          <p className="mt-4 text-xs text-zinc-500">
            Research only · Not a loan offer · Guest-saved on this device
          </p>
          <div className="mt-2">
            <TrustMark />
          </div>
          {error ? (
            <p className="mt-3 text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </Button>
        {step < 3 ? (
          <div className="flex flex-wrap gap-2">
            {step === 2 ? (
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Skip
              </Button>
            ) : null}
            <Button
              type="button"
              variant="trust"
              className="gap-1"
              onClick={() => {
                if (step === 0 && focus.length === 0) {
                  setError('Select at least one loan focus.');
                  return;
                }
                setError(null);
                setStep((s) => Math.min(3, s + 1));
              }}
            >
              Continue <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        ) : (
          <Button type="button" variant="trust" onClick={finish}>
            Save plan
          </Button>
        )}
      </div>
      {error && step === 0 ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
