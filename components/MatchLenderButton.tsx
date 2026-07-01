'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buildMatchUrl, type LenderFilters } from '@/lib/lenders';
import { Button } from '@/components/ui/button';

export function MatchLenderButton({
  filters = {},
  className,
  label = 'Match Me to Local Lenders',
  onNavigate,
}: {
  filters?: LenderFilters;
  className?: string;
  label?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link href={buildMatchUrl(filters)} className={className} onClick={onNavigate}>
      <Button className="w-full sm:w-auto" variant="trust">
        {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </Link>
  );
}