import { Suspense } from 'react';
import { PersonalizedLenderBanner, type PersonalizedLenderBannerProps } from '@/components/PersonalizedLenderBanner';

function BannerFallback() {
  return null;
}

/**
 * Required Suspense boundary for PersonalizedLenderBanner (useSearchParams).
 *
 * @example
 * // app/local-lenders/page.tsx
 * import { PersonalizedLenderBannerBoundary } from '@/components/PersonalizedLenderBannerBoundary';
 * <PersonalizedLenderBannerBoundary experimentKey="personalized-banner-v1" />
 */
export function PersonalizedLenderBannerBoundary(props: PersonalizedLenderBannerProps) {
  return (
    <Suspense fallback={<BannerFallback />}>
      <PersonalizedLenderBanner {...props} />
    </Suspense>
  );
}