'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getHubLastLocation,
  HUB_RESUME_PARAM,
  isHomePath,
  saveHubLastLocation,
  type SpecialistHubId,
} from '@/lib/network/hub-last-location';

/**
 * Tracks last path for this hub and restores it when entering via Switch Hub
 * (`?hub_resume=1`). Mount once in the root layout.
 */
export function HubLastLocationBridge({ hubId }: { hubId: SpecialistHubId }) {
  return (
    <Suspense fallback={null}>
      <HubLastLocationBridgeInner hubId={hubId} />
    </Suspense>
  );
}

function HubLastLocationBridgeInner({ hubId }: { hubId: SpecialistHubId }) {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeHandled = useRef(false);

  // Resume once when arriving from Switch Hub
  useEffect(() => {
    if (resumeHandled.current) return;
    if (searchParams.get(HUB_RESUME_PARAM) !== '1') return;
    resumeHandled.current = true;

    const last = getHubLastLocation(hubId);
    const params = new URLSearchParams(searchParams.toString());
    params.delete(HUB_RESUME_PARAM);
    const qs = params.toString();
    const cleanedHome = qs ? `/?${qs}` : '/';

    if (last && !isHomePath(last)) {
      router.replace(last);
      return;
    }
    // First visit or only home saved — stay on homepage without resume param
    if (pathname === '/' && searchParams.has(HUB_RESUME_PARAM)) {
      router.replace(cleanedHome);
    }
  }, [hubId, pathname, searchParams, router]);

  // Persist current location (skip while resume param still present)
  useEffect(() => {
    if (searchParams.get(HUB_RESUME_PARAM) === '1') return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(HUB_RESUME_PARAM);
    const qs = params.toString();
    const path = `${pathname}${qs ? `?${qs}` : ''}`;
    saveHubLastLocation(hubId, path);
  }, [hubId, pathname, searchParams]);

  return null;
}
