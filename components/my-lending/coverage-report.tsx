'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, Mail, Printer } from 'lucide-react';
import {
  LOAN_FOCUS_OPTIONS,
  type CalculatorSnapshot,
  type FinancePlan,
  type SavedLender,
} from '@/lib/my-lending/types';
import {
  getActivePlan,
  getCalculatorSnapshots,
  getLendersForPlan,
  getShortlisted,
  loadState,
  SHORTLIST_CAP,
} from '@/lib/my-lending/storage';
import { TrustMark } from '@/components/network/trust-mark';
import { Button } from '@/components/ui/button';

function buildPlainText(params: {
  plan: FinancePlan | null;
  shortlist: SavedLender[];
  snapshots: CalculatorSnapshot[];
}): string {
  const { plan, shortlist, snapshots } = params;
  const lines: string[] = [
    plan?.label
      ? `Financing research summary: ${plan.label}`
      : 'Your financing research summary',
    'Research only · Not a loan offer · Lender Trust Hub',
    '',
  ];
  if (plan) {
    lines.push(
      `Plan: ${plan.label}`,
      `Loan focus: ${
        plan.loanFocus
          .map((id) => LOAN_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id)
          .join(', ') || '—'
      }`,
      `Location: ${
        plan.location?.label ||
        [plan.location?.zip, plan.location?.state].filter(Boolean).join(' ') ||
        '—'
      }`,
      plan.notes ? `Notes: ${plan.notes}` : '',
      `Updated: ${new Date(plan.updatedAt).toLocaleString()}`,
      ''
    );
  }
  lines.push(`Shortlist (${shortlist.length}/${SHORTLIST_CAP}):`);
  if (shortlist.length === 0) {
    lines.push('  (none yet)');
  } else {
    for (const l of shortlist) {
      lines.push(
        `  • ${l.lenderName} [${l.status}]`,
        `    ${typeof window !== 'undefined' ? window.location.origin : 'https://www.lendertrusthub.com'}${l.profilePath}`,
        l.nmlsId || l.licenseSummary
          ? `    ${l.licenseSummary || `NMLS #${l.nmlsId}`}`
          : ''
      );
    }
  }
  lines.push(
    '',
    'Verification checklist:',
    '  1. Re-check every NMLS ID on NMLS Consumer Access before applying.',
    '  2. Educational calculator estimates are not Loan Estimates or offers.',
    '  3. Compare written terms from multiple licensed lenders yourself.',
    '  4. Lender Trust Hub is not a lender or broker and has zero paid placements.'
  );
  if (snapshots.length) {
    lines.push('', 'Calculator snapshots:');
    for (const s of snapshots) {
      lines.push(`  • ${s.title}`, `    ${s.summary}`, s.href ? `    ${s.href}` : '');
    }
  }
  lines.push(
    '',
    'Primary source: https://www.nmlsconsumeraccess.org/',
    'Standard: https://www.asktrusthub.com/methodology'
  );
  return lines.filter((l) => l !== undefined && l !== '').join('\n');
}

/**
 * Report-ready takeaway — copy / print / mailto.
 */
export function CoverageReport() {
  const [plan, setPlan] = useState<FinancePlan | null>(null);
  const [lenders, setLenders] = useState<SavedLender[]>([]);
  const [snapshots, setSnapshots] = useState<CalculatorSnapshot[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    const state = loadState();
    const active = getActivePlan(state);
    setPlan(active);
    setLenders(active ? getLendersForPlan(active.id, state) : []);
    setSnapshots(active ? getCalculatorSnapshots(active.id) : []);
  }, []);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const onStore = () => refresh();
    window.addEventListener('lth-my-lending-store', onStore);
    return () => window.removeEventListener('lth-my-lending-store', onStore);
  }, [refresh]);

  const shortlist = useMemo(() => getShortlisted(lenders), [lenders]);
  const hasContent = Boolean(plan || shortlist.length || snapshots.length);

  const plainText = useMemo(
    () => buildPlainText({ plan, shortlist, snapshots }),
    [plan, shortlist, snapshots]
  );

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent(
      plan?.label
        ? `Financing research: ${plan.label}`
        : 'My Lending financing research summary'
    );
    const body = encodeURIComponent(plainText);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [plainText, plan?.label]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
        Loading report...
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-10 text-center">
        <h2 className="text-lg font-semibold text-[#0A2540]">Nothing on your report yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">
          Complete guided setup, shortlist lenders, or save a calculator snapshot — then return for
          a takeaway summary.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href="/my-lending/setup">
            <Button variant="trust">Guided setup</Button>
          </Link>
          <Link href="/local-lenders">
            <Button variant="outline">Directory</Button>
          </Link>
          <Link href="/calculators">
            <Button variant="outline">Calculators</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-4">
      <header className="print:break-inside-avoid">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0A2540] sm:text-3xl">
          {plan?.label
            ? `Financing research: ${plan.label}`
            : 'Your financing research summary'}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Research only · Not a loan offer · Guest-saved on this device
        </p>
        <div className="mt-2">
          <TrustMark />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <Button type="button" variant="outline" className="gap-1.5" onClick={onCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy summary'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" aria-hidden />
            Print
          </Button>
          <a
            href={mailtoHref}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-[#0A2540] hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <Mail className="h-4 w-4" aria-hidden />
            Email me this report
          </a>
          <Link href="/my-lending">
            <Button type="button" variant="ghost">
              Back to HQ
            </Button>
          </Link>
        </div>
      </header>

      {plan ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Plan</h2>
          <p className="mt-1 text-lg font-semibold text-[#0A2540]">{plan.label}</p>
          <p className="mt-2 text-sm text-zinc-600">
            Loan focus:{' '}
            {plan.loanFocus
              .map((id) => LOAN_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id)
              .join(' · ') || '—'}
          </p>
          <p className="text-sm text-zinc-600">
            Location:{' '}
            {plan.location?.label ||
              [plan.location?.zip, plan.location?.state].filter(Boolean).join(' ') ||
              '—'}
          </p>
          {plan.notes ? <p className="mt-2 text-sm text-zinc-700">{plan.notes}</p> : null}
          <p className="mt-2 text-xs text-zinc-500">
            Updated {new Date(plan.updatedAt).toLocaleString()}
          </p>
        </section>
      ) : null}

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Shortlist ({shortlist.length}/{SHORTLIST_CAP})
        </h2>
        {shortlist.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">
            No shortlisted lenders yet.{' '}
            <Link href="/local-lenders" className="font-medium text-emerald-800 underline">
              Browse directory
            </Link>
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {shortlist.map((l) => (
              <li
                key={l.id}
                className="rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-3"
              >
                <p className="font-semibold text-[#0A2540]">{l.lenderName}</p>
                <p className="text-xs text-zinc-500">
                  {l.licenseSummary || (l.nmlsId ? `NMLS #${l.nmlsId}` : '')}
                  {l.status ? ` · ${l.status}` : ''}
                </p>
                <Link
                  href={l.profilePath}
                  className="mt-1 inline-block text-sm font-medium text-emerald-800 underline"
                >
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}${l.profilePath}`
                    : l.profilePath}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Verification checklist
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-zinc-800">
          <li>
            Re-check every NMLS ID on{' '}
            <a
              href="https://www.nmlsconsumeraccess.org/"
              className="font-medium text-emerald-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              NMLS Consumer Access
            </a>{' '}
            before applying.
          </li>
          <li>Educational calculator estimates are not Loan Estimates or credit decisions.</li>
          <li>Compare written terms from multiple licensed lenders yourself.</li>
          <li>
            Lender Trust Hub is not a lender or broker and has zero paid placements.
          </li>
        </ol>
      </section>

      {snapshots.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Calculator snapshots
          </h2>
          <ul className="mt-3 space-y-3">
            {snapshots.map((s) => (
              <li key={s.id} className="rounded-lg border border-zinc-100 px-3 py-3">
                <p className="font-semibold text-[#0A2540]">{s.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{s.summary}</p>
                {s.href ? (
                  <Link
                    href={s.href}
                    className="mt-1 inline-block text-sm font-medium text-emerald-800 underline"
                  >
                    Open tool
                  </Link>
                ) : null}
                <p className="mt-1 text-xs text-zinc-400">
                  {new Date(s.savedAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
