'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Building2,
  ExternalLink,
  MapPin,
  Plus,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  LOAN_FOCUS_OPTIONS,
  LENDER_STATUS_OPTIONS,
  type FinancePlan,
  type LoanFocus,
  type LenderResearchStatus,
  type SavedLender,
} from '@/lib/my-lending/types';
import {
  ensureActivePlan,
  getActivePlan,
  getLastSaveError,
  getLendersForPlan,
  loadMyLendingStore,
  removeSavedLender,
  updateSavedLenderStatus,
  upsertPlan,
} from '@/lib/my-lending/storage';
import { TrustMark } from '@/components/network/trust-mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Phase A guest-first Lending HQ - durable plan + saved lenders in localStorage.
 * Research only; no lead-gen.
 */
export function GuestLendingHq() {
  const [plan, setPlan] = useState<FinancePlan | null>(null);
  const [lenders, setLenders] = useState<SavedLender[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [label, setLabel] = useState('');
  const [zip, setZip] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [notes, setNotes] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const store = loadMyLendingStore();
    const active = getActivePlan(store);
    setPlan(active);
    if (active) {
      setLenders(getLendersForPlan(active.id, store));
      setLabel(active.label);
      setZip(active.location?.zip ?? '');
      setStateCode(active.location?.state ?? '');
      setNotes(active.notes ?? '');
      setFocus(active.loanFocus ?? []);
    } else {
      setLenders([]);
    }
  }, []);

  useEffect(() => {
    ensureActivePlan({ label: 'My financing research' });
    refresh();
    setHydrated(true);
    const onStore = () => refresh();
    window.addEventListener('lth-my-lending-store', onStore);
    window.addEventListener('storage', onStore);
    return () => {
      window.removeEventListener('lth-my-lending-store', onStore);
      window.removeEventListener('storage', onStore);
    };
  }, [refresh]);

  const locationLabel = useMemo(() => {
    const parts = [zip, stateCode].filter(Boolean);
    return parts.join(' · ') || undefined;
  }, [zip, stateCode]);

  function persistPlanFields() {
    setError(null);
    setMessage(null);
    if (!label.trim()) {
      setError('Plan label is required.');
      return;
    }
    if (focus.length === 0) {
      setError('Select at least one loan focus.');
      return;
    }
    const active = ensureActivePlan();
    upsertPlan({
      id: active.id,
      label: label.trim() || 'My financing research',
      loanFocus: focus,
      notes: notes.trim() || undefined,
      location: {
        zip: zip.trim() || undefined,
        state: stateCode.trim().toUpperCase().slice(0, 2) || undefined,
        label: locationLabel,
      },
    });
    const err = getLastSaveError();
    if (err) {
      setError(err);
      return;
    }
    setMessage('Plan saved on this device.');
    refresh();
  }

  function toggleFocus(id: LoanFocus) {
    setFocus((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
        Loading Lending HQ...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
          Active plan
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[#0A2540]">
          {plan?.label || 'Financing research plan'}
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-zinc-600">
          Guest-saved on this device. Edit details below or save lenders from profiles. Research
          only - not a marketplace or pre-approval service.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="plan-label" className="text-sm font-medium text-zinc-800">
              Plan label <span className="text-rose-600">*</span>
            </label>
            <input
              id="plan-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Purchase - Austin TX"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="plan-zip" className="text-sm font-medium text-zinc-800">
              ZIP (optional)
            </label>
            <input
              id="plan-zip"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="78701"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              inputMode="numeric"
            />
          </div>
          <div>
            <label htmlFor="plan-state" className="text-sm font-medium text-zinc-800">
              State (optional)
            </label>
            <input
              id="plan-state"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="TX"
              maxLength={2}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-800">
            Loan focus <span className="text-rose-600">*</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {LOAN_FOCUS_OPTIONS.map((opt) => {
              const on = focus.includes(opt.id);
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => toggleFocus(opt.id)}
                    className={cn(
                      'inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                      on
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-teal-300'
                    )}
                    aria-pressed={on}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4">
          <label htmlFor="plan-notes" className="text-sm font-medium text-zinc-800">
            Notes (optional)
          </label>
          <textarea
            id="plan-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder="e.g. First-time buyer; comparing FHA vs conventional"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="trust" onClick={persistPlanFields}>
            Save plan on this device
          </Button>
          <Link href="/local-lenders">
            <Button type="button" variant="outline">
              <Plus className="h-4 w-4" aria-hidden />
              Local lenders
            </Button>
          </Link>
          <Link href="/calculators">
            <Button type="button" variant="outline">
              Calculators
            </Button>
          </Link>
          <Link href="/about">
            <Button type="button" variant="ghost">
              About
            </Button>
          </Link>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-teal-800" role="status">
            {message}
          </p>
        ) : null}
        {plan ? (
          <p className="mt-3 text-xs text-zinc-500">
            {lenders.length} saved lender{lenders.length === 1 ? '' : 's'} · Updated{' '}
            {new Date(plan.updatedAt).toLocaleString()}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
          <Bookmark className="h-5 w-5 text-teal-700" aria-hidden />
          Saved lenders ({lenders.length})
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Track research status. Verify NMLS on Consumer Access before you apply.
        </p>

        {lenders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center">
            <Building2 className="mx-auto h-8 w-8 text-zinc-300" aria-hidden />
            <p className="mt-2 font-medium text-zinc-800">No saved lenders yet</p>
            <p className="mt-1 text-sm text-zinc-600">
              Open a lender profile and choose <strong>Save to My Lending</strong>, or browse the
              directory and educational calculators.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/local-lenders">
                <Button variant="trust">Browse local lenders</Button>
              </Link>
              <Link href="/calculators">
                <Button variant="outline">Calculators</Button>
              </Link>
            </div>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {lenders.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={l.profilePath || `/lenders/${l.lenderSlug}`}
                    className="font-semibold text-[#0A2540] hover:text-[#059669] hover:underline"
                  >
                    {l.lenderName}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    {l.nmlsId || l.licenseSummary ? (
                      <span>{l.licenseSummary || `NMLS #${l.nmlsId}`}</span>
                    ) : null}
                    {l.loanTypes?.length ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {l.loanTypes.slice(0, 4).join(', ')}
                      </span>
                    ) : null}
                  </p>
                  <span
                    className={cn(
                      'mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
                      l.status === 'shortlisted' && 'bg-teal-100 text-teal-900',
                      l.status === 'researching' && 'bg-sky-100 text-sky-900',
                      l.status === 'reached_out' && 'bg-amber-100 text-amber-900',
                      l.status === 'done' && 'bg-zinc-200 text-zinc-700'
                    )}
                  >
                    {LENDER_STATUS_OPTIONS.find((s) => s.id === l.status)?.label ?? l.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${l.id}`}>
                    Status for {l.lenderName}
                  </label>
                  <select
                    id={`status-${l.id}`}
                    value={l.status}
                    onChange={(e) => {
                      updateSavedLenderStatus(l.id, e.target.value as LenderResearchStatus);
                      refresh();
                    }}
                    className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-sm"
                  >
                    {LENDER_STATUS_OPTIONS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <Link href={l.profilePath || `/lenders/${l.lenderSlug}`}>
                    <Button type="button" variant="outline" size="sm">
                      Profile <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      removeSavedLender(l.lenderSlug, plan?.id);
                      refresh();
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
        <p className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden />
          <span>
            Research only · Not an endorsement · Not a lender or broker · Verify licenses on{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/"
              className="font-medium text-[#059669] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              NMLS Consumer Access
            </a>
            . Common ownership network · No paid placements.
          </span>
        </p>
        <div className="mt-2">
          <TrustMark />
        </div>
      </div>
    </div>
  );
}
