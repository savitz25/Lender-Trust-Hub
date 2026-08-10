import { PROGRAM_DISCLAIMER } from '@/lib/programs';
import { cn } from '@/lib/utils';

export function ProgramDisclaimer({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        'rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-xs leading-relaxed text-zinc-700',
        className
      )}
      role="note"
    >
      <p className="font-semibold text-[#0A2540]">Educational research only</p>
      <p className="mt-1">{PROGRAM_DISCLAIMER}</p>
      <p className="mt-2 font-medium text-zinc-600">We show the public record. You decide.</p>
    </aside>
  );
}
