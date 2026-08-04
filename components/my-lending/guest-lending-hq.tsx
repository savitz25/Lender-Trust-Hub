'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Building2,
  Calculator,
  ExternalLink,
  FileText,
  MapPin,
  Plus,
  Settings2,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  LOAN_FOCUS_OPTIONS,
  LENDER_STATUS_OPTIONS,
  type CalculatorSnapshot,
  type FinancePlan,
  type LoanFocus,
  type LenderResearchStatus,
  type SavedLender,
} from '@/lib/my-lending/types';
import {
  ensureActivePlan,
  getActivePlan,
  getCalculatorSnapshots,
  getHistory,
  getLastSaveError,
  getLendersForPlan,
  getResearching,
  getShortlisted,
  listActivePlans,
  loadMyLendingStore,
  removeSavedLender,
  setActivePlan,
  SHORTLIST_CAP,
  shortlistReplacing,
  shortlistWithDemoteOldest,
  updateSavedLenderStatus,
  upsertPlan,
} from '@/lib/my-lending/storage';
import { ShortlistFullPanel } from '@/components/my-lending/shortlist-full-panel';
import { TrustMark } from '@/components/network/trust-mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Phase B guest-first Lending HQ — shortlist cap 3 + status buckets.
 * Research only; no lead-gen.
 */
export function GuestLendingHq() {
  const [plan, setPlan] = useState<FinancePlan | null>(null);
  const [lenders, setLenders] = useState<SavedLender[]>([]);
  const [snapshots, setSnapshots] = useState<CalculatorSnapshot[]>([]);
  const [openPlans, setOpenPlans] = useState<FinancePlan[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [label, setLabel] = useState('');
  const [zip, setZip] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [notes, setNotes] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullPanel, setFullPanel] = useState<{
    shortlisted: SavedLender[];
    pendingId: string;
    pendingName: string;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const refresh = useCallback(() => {
    const store = loadMyLendingStore();
    const active = getActivePlan(store);
    setPlan(active);
    setOpenPlans(listActivePlans(store));
    if (active) {
      setLenders(getLendersForPlan(active.id, store));
      setSnapshots(getCalculatorSnapshots(active.id));
      setLabel(active.label);
      setZip(active.location?.zip ?? '');
      setStateCode(active.location?.state ?? '');
      setNotes(active.notes ?? '');
      setFocus(active.loanFocus ?? []);
    } else {
      setLenders([]);
      setSnapshots([]);
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
      <nav aria-label="My Lending sections" className="flex flex-wrap gap-2">
        <Link href="/my-lending/plans">
          <Button size="sm" variant="outline" className="gap-1.5">
            All plans
          </Button>
        </Link>
        <Link href="/my-lending/setup">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
            Setup
          </Button>
        </Link>
        <Link href="/my-lending/report">
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Report
          </Button>
        </Link>
        <Link href="/calculators">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Calculator className="h-3.5 w-3.5" aria-hidden />
            Calculators
          </Button>
        </Link>
      </nav>

      <section className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
              Active plan
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#0A2540]">
              {plan?.label || 'Financing research plan'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              Guest-saved on this device. Shortlist and snapshots attach to this plan only. Research
              only — not a marketplace or pre-approval service.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {openPlans.length > 1 ? (
              <select
                className="h-9 max-w-[14rem] rounded-md border border-zinc-200 bg-white px-2 text-sm font-medium text-zinc-800"
                value={plan?.id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  setActivePlan(id);
                  refresh();
                }}
                aria-label="Switch active plan"
              >
                {openPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : null}
            <Link href="/my-lending/plans">
              <Button size="sm" variant="outline">
                All plans
              </Button>
            </Link>
          </div>
        </div>

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
            Shortlist {getShortlisted(lenders).length}/{SHORTLIST_CAP} · {lenders.length} saved
            total · {snapshots.length} calculator snapshot
            {snapshots.length === 1 ? '' : 's'} · Updated{' '}
            {new Date(plan.updatedAt).toLocaleString()}
          </p>
        ) : null}
      </section>

      {snapshots.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
            <Calculator className="h-5 w-5 text-emerald-700" aria-hidden />
            Calculator snapshots ({snapshots.length})
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Educational estimates only — not a Loan Estimate or offer.
          </p>
          <ul className="mt-4 space-y-2">
            {snapshots.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#0A2540]">{s.title}</p>
                  <p className="text-xs text-zinc-500">{s.summary}</p>
                </div>
                {s.href ? (
                  <Link href={s.href}>
                    <Button size="sm" variant="outline">
                      Open tool
                    </Button>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/my-lending/report" className="font-medium text-emerald-800 underline">
              Include on report
            </Link>
            {' · '}
            <Link href="/calculators" className="font-medium text-emerald-800 underline">
              Run another calculator
            </Link>
          </p>
        </section>
      ) : null}

      <LenderBucket
        title={`Shortlist (${getShortlisted(lenders).length}/${SHORTLIST_CAP})`}
        hint="Top candidates — max 3. Promote carefully. Research only."
        items={getShortlisted(lenders)}
        empty="No shortlisted lenders yet. Save from a profile or directory card."
        planId={plan?.id}
        onStatus={(id, status, name) => {
          const res = updateSavedLenderStatus(id, status);
          if (res && !res.ok && res.reason === 'shortlist_full' && res.shortlisted) {
            setFullPanel({ shortlisted: res.shortlisted, pendingId: id, pendingName: name });
          } else {
            refresh();
          }
        }}
        onRemove={(slug) => {
          removeSavedLender(slug, plan?.id);
          refresh();
        }}
      />

      <LenderBucket
        title={`Still researching (${getResearching(lenders).length})`}
        hint="Directory saves can land here when shortlist is full."
        items={getResearching(lenders)}
        empty="Nothing in researching."
        planId={plan?.id}
        onStatus={(id, status, name) => {
          const res = updateSavedLenderStatus(id, status);
          if (res && !res.ok && res.reason === 'shortlist_full' && res.shortlisted) {
            setFullPanel({ shortlisted: res.shortlisted, pendingId: id, pendingName: name });
          } else {
            refresh();
          }
        }}
        onRemove={(slug) => {
          removeSavedLender(slug, plan?.id);
          refresh();
        }}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
        >
          <h2 className="text-lg font-semibold text-[#0A2540]">
            Reached out / done ({getHistory(lenders).length})
          </h2>
          <span className="text-xs font-medium text-zinc-500">
            {historyOpen ? 'Hide' : 'Show'}
          </span>
        </button>
        {historyOpen ? (
          <div className="mt-4">
            {getHistory(lenders).length === 0 ? (
              <p className="text-sm text-zinc-500">No history yet.</p>
            ) : (
              <LenderList
                items={getHistory(lenders)}
                planId={plan?.id}
                onStatus={(id, status, name) => {
                  const res = updateSavedLenderStatus(id, status);
                  if (res && !res.ok && res.reason === 'shortlist_full' && res.shortlisted) {
                    setFullPanel({
                      shortlisted: res.shortlisted,
                      pendingId: id,
                      pendingName: name,
                    });
                  } else {
                    refresh();
                  }
                }}
                onRemove={(slug) => {
                  removeSavedLender(slug, plan?.id);
                  refresh();
                }}
              />
            )}
          </div>
        ) : null}
      </section>

      {lenders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-zinc-400" aria-hidden />
          <p className="mt-2 font-medium text-zinc-800">No saved lenders yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            Save from a lender profile or directory card (shortlist max {SHORTLIST_CAP}).
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
      ) : null}

      {fullPanel ? (
        <ShortlistFullPanel
          shortlisted={fullPanel.shortlisted}
          incomingName={fullPanel.pendingName}
          onCancel={() => setFullPanel(null)}
          onDemoteOldest={() => {
            const p = lenders.find((x) => x.id === fullPanel.pendingId);
            if (p) {
              shortlistWithDemoteOldest({
                lenderSlug: p.lenderSlug,
                lenderName: p.lenderName,
                profilePath: p.profilePath,
                nmlsId: p.nmlsId,
                loanTypes: p.loanTypes,
                status: 'shortlisted',
              });
            }
            setFullPanel(null);
            refresh();
          }}
          onReplace={(slug) => {
            const p = lenders.find((x) => x.id === fullPanel.pendingId);
            if (p) {
              shortlistReplacing(
                {
                  lenderSlug: p.lenderSlug,
                  lenderName: p.lenderName,
                  profilePath: p.profilePath,
                  nmlsId: p.nmlsId,
                  loanTypes: p.loanTypes,
                  status: 'shortlisted',
                },
                slug
              );
            }
            setFullPanel(null);
            refresh();
          }}
          onSaveAsResearching={() => {
            updateSavedLenderStatus(fullPanel.pendingId, 'researching');
            setFullPanel(null);
            refresh();
          }}
        />
      ) : null}

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

function LenderBucket({
  title,
  hint,
  items,
  empty,
  planId,
  onStatus,
  onRemove,
}: {
  title: string;
  hint: string;
  items: SavedLender[];
  empty: string;
  planId?: string;
  onStatus: (id: string, status: LenderResearchStatus, name: string) => void;
  onRemove: (slug: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
        <Bookmark className="h-5 w-5 text-emerald-700" aria-hidden />
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">{hint}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">{empty}</p>
      ) : (
        <div className="mt-4">
          <LenderList items={items} planId={planId} onStatus={onStatus} onRemove={onRemove} />
        </div>
      )}
    </section>
  );
}

function LenderList({
  items,
  planId,
  onStatus,
  onRemove,
}: {
  items: SavedLender[];
  planId?: string;
  onStatus: (id: string, status: LenderResearchStatus, name: string) => void;
  onRemove: (slug: string) => void;
}) {
  return (
    <ul className="space-y-3">
      {items.map((l) => (
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
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`status-${l.id}`}>
              Status for {l.lenderName}
            </label>
            <select
              id={`status-${l.id}`}
              value={l.status}
              onChange={(e) =>
                onStatus(l.id, e.target.value as LenderResearchStatus, l.lenderName)
              }
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
              onClick={() => onRemove(l.lenderSlug)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              <span className="sr-only">Remove</span>
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
