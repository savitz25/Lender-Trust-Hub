import { CALC_DISCLAIMER } from '@/lib/calculators/registry';
import { cn } from '@/lib/utils';

export function CalcDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'border-l-[3px] border-emerald-500 bg-emerald-50/50 py-2 pl-3 text-xs leading-relaxed text-zinc-600 dark:bg-emerald-950/20 dark:text-zinc-400',
        className,
      )}
      role="note"
    >
      {CALC_DISCLAIMER}
    </p>
  );
}