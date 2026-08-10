import { cn } from '@/lib/utils';

/** Shared research positioning line for evidence panels and tool footers. */
export function PublicRecordTagline({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs font-medium leading-relaxed text-zinc-600', className)}>
      We show the public record. You decide.
    </p>
  );
}
