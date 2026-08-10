import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ProgramGuide } from '@/lib/programs';
import { cn } from '@/lib/utils';

export function ProgramCard({
  program,
  className,
  compact,
}: {
  program: ProgramGuide;
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/programs/${program.slug}`}
      className={cn(
        'group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md',
        className
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
        Mortgage program
      </p>
      <h3 className="mt-1 text-lg font-bold text-[#0A2540] group-hover:text-emerald-900">
        {program.name}
      </h3>
      <p className={cn('mt-2 flex-1 text-zinc-600', compact ? 'text-xs' : 'text-sm')}>
        {program.tagline}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
        Read overview
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
