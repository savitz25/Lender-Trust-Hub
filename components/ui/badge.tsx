import { cn } from '@/lib/utils';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'trust' | 'outline' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variant === 'default' && 'bg-zinc-100 text-zinc-700',
        variant === 'trust' && 'bg-emerald-100 text-emerald-700',
        variant === 'outline' && 'border border-zinc-200 text-zinc-600',
        className
      )}
      {...props}
    />
  );
}