'use client';

import { useEffect } from 'react';
import { ProfileViewed } from '@/components/analytics/profile-viewed';
import { trackLenderProfileView } from '@/lib/analytics/ga-events';

export function LenderProfileViewTracker({
  slug,
  nmlsVerified,
}: {
  slug: string;
  nmlsVerified?: boolean;
}) {
  useEffect(() => {
    trackLenderProfileView({ slug, nmls_verified: nmlsVerified });
  }, [slug, nmlsVerified]);

  return <ProfileViewed />;
}
