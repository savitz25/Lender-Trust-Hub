import { cn, formatCurrency } from '@/lib/utils';

/** Result hero — brand green, light Trust Hub system (not navy/black). */
export function ResultHero({
  label,
  value,
  meta,
  className,
}: {
  label: string;
  value: string;
  meta?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] p-6 text-center text-white shadow-sm',
        className
      )}
    >
      <p className="text-sm opacity-90">{label}</p>
      <p className="text-3xl font-extrabold tracking-tight md:text-4xl">{value}</p>
      {meta && <p className="mt-2 text-xs opacity-80">{meta}</p>}
    </div>
  );
}

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{children}</div>;
}

export function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'teal' | 'rose';
}) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className={cn(
          'mt-1 block text-base font-bold text-[#0A2540]',
          highlight === 'teal' && 'text-emerald-600',
          highlight === 'rose' && 'text-rose-600'
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function formatUSD(v: number, decimals = 0) {
  return formatCurrency(v);
}
