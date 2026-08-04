import { cn } from '@/lib/utils';

export function CalcSkeleton({ className }: { className?: string }) {
 return <div className={cn('animate-pulse rounded-xl bg-zinc-200', className)} aria-hidden="true" />;
}

export function CalcHubSkeleton() {
 return (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading calculator">
 {Array.from({ length: 6 }).map((_, i) => (
 <CalcSkeleton key={i} className="h-48" />
 ))}
 </div>
 );
}