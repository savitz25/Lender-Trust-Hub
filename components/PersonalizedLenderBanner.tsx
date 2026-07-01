'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackCalcEvent } from '@/lib/analytics/calculators';
import {
  buildMatchUrlFromProfile,
  getBannerCopy,
  parseLenderMatchFromParams,
  resolveBannerVariant,
  type BannerVariant,
  type LenderMatchProfile,
} from '@/lib/lenders/match-profile';

const DISMISS_PREFIX = 'lth-personalized-banner-dismissed';

function dismissKey(profile: LenderMatchProfile): string {
  return `${DISMISS_PREFIX}-${profile.estimatedLoan ?? 0}-${profile.estimatedRate ?? 0}-${profile.loanType ?? ''}`;
}

export interface PersonalizedLenderBannerProps {
  /** Visual / copy variant — use with experimentKey for A/B tests */
  variant?: BannerVariant;
  /** When set, assigns stable A/B variant via getABVariant (e.g. "personalized-banner-v1") */
  experimentKey?: string;
  /** Optional className for layout overrides */
  className?: string;
}

/**
 * Contextual banner when users arrive from calculators with ?loan=, ?rate=, ?loanType= params.
 * Place inside <Suspense> on directory pages (useSearchParams requirement).
 */
export function PersonalizedLenderBanner({
  variant = 'default',
  experimentKey,
  className = '',
}: PersonalizedLenderBannerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [abVariant, setAbVariant] = useState<BannerVariant>(variant);

  const profile = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return parseLenderMatchFromParams(params);
  }, [searchParams]);

  const effectiveVariant = experimentKey ? abVariant : variant;

  useEffect(() => {
    if (experimentKey) {
      setAbVariant(resolveBannerVariant(variant, experimentKey));
    }
  }, [experimentKey, variant]);

  useEffect(() => {
    if (!profile) return;
    try {
      if (sessionStorage.getItem(dismissKey(profile)) === '1') {
        setDismissed(true);
        return;
      }
    } catch {
      /* ignore */
    }
    trackCalcEvent('calc_banner_view', {
      loan_amount: profile.estimatedLoan,
      rate: profile.estimatedRate,
      loan_type: profile.loanType,
      variant: effectiveVariant,
      ab_variant: experimentKey ? effectiveVariant : undefined,
      source: 'directory',
    });
  }, [profile, effectiveVariant, experimentKey]);

  const handleDismiss = useCallback(() => {
    if (!profile) return;
    try {
      sessionStorage.setItem(dismissKey(profile), '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
    trackCalcEvent('calc_banner_dismiss', {
      loan_amount: profile.estimatedLoan,
      rate: profile.estimatedRate,
      loan_type: profile.loanType,
      variant: effectiveVariant,
    });
  }, [profile, effectiveVariant]);

  const handleApplyFilters = useCallback(() => {
    if (!profile) return;
    const url = buildMatchUrlFromProfile(profile);
    trackCalcEvent('calc_banner_cta_click', {
      loan_amount: profile.estimatedLoan,
      rate: profile.estimatedRate,
      loan_type: profile.loanType,
      credit_tier: profile.creditTier,
      variant: effectiveVariant,
      source: 'directory',
    });
    router.push(url);
    requestAnimationFrame(() => {
      document.getElementById('lender-directory')?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [profile, effectiveVariant, router]);

  if (!profile || dismissed) return null;

  const copy = getBannerCopy(profile, effectiveVariant);

  return (
    <section
      role="region"
      aria-label="Personalized lender match from your calculator"
      data-variant={effectiveVariant}
      data-experiment={experimentKey}
      className={`relative border-b border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/80 dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-emerald-950/20 ${className}`}
    >
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:py-5">
        <div className="flex min-w-0 flex-1 items-start gap-3 pr-8 md:pr-0">
          <Sparkles
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-white md:text-base">
              {copy.headline}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 md:text-sm">
              {copy.body}
            </p>
            <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-500">
              Educational estimates only. Not a loan offer. Zero paid placements.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="trust"
            size="sm"
            className="gap-1.5"
            onClick={handleApplyFilters}
          >
            {copy.cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 md:right-4 md:top-4"
          aria-label="Dismiss personalized lender banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

/** Suspense-friendly wrapper — import this in server pages */
export function PersonalizedLenderBannerSlot(props: PersonalizedLenderBannerProps) {
  return <PersonalizedLenderBanner {...props} />;
}