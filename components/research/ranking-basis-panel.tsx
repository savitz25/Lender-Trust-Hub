import Link from 'next/link';
import { LENDER_RANKING_BASIS } from '@/lib/research/research-signals';

type Props = {
  className?: string;
  /** Extra context e.g. in-county vs nearby counts */
  localityNote?: string;
};

/** Explains organic order — locality first; not a purchased ranking. */
export function RankingBasisPanel({ className = '', localityNote }: Props) {
  const b = LENDER_RANKING_BASIS;
  return (
    <aside
      className={`rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 text-sm leading-relaxed text-zinc-700 ${className}`}
      aria-label="How this list is ordered"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
        How this list is ordered
      </p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4">
        <li>
          <strong className="text-[#0A2540]">Primary:</strong> {b.primaryOrder}
        </li>
        <li>
          <strong className="text-[#0A2540]">Within each band:</strong> {b.secondaryOrder}
        </li>
      </ol>
      {localityNote ? (
        <p className="mt-2 text-xs leading-relaxed text-zinc-600">{localityNote}</p>
      ) : null}
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-zinc-600">
        {b.rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-relaxed text-zinc-600">
        <Link
          href="/methodology#scores"
          className="inline-flex min-h-11 items-center font-medium text-[#059669] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#059669]"
        >
          Research methodology
        </Link>
        {' · '}
        List order is for research convenience — not a “best lender” award.
      </p>
    </aside>
  );
}
