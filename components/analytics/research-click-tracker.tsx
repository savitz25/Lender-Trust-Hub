'use client';

import { useEffect } from 'react';
import {
  trackNmlsVerificationLookup,
  trackOutboundPrimarySource,
  trackOutboundSpecialistHub,
  trackResearchPathClick,
} from '@/lib/analytics/ga-events';
import {
  LENDER_MEASUREMENT_BASELINE_DATE,
  LENDER_MEASUREMENT_BASELINE_LABEL,
} from '@/lib/analytics/measurement-baseline';

/**
 * Phase 5 — capture NMLS lookups, primary-source outs, cross-hub handoffs,
 * and key internal research path clicks. Mount once in root layout.
 */

function closestAnchor(target: EventTarget | null): HTMLAnchorElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest('a[href]');
}

function hostOf(href: string): string | null {
  try {
    return new URL(href, window.location.origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function pathOf(href: string): string | null {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return null;
  }
}

function isNmlsHost(host: string): boolean {
  return (
    host === 'www.nmlsconsumeraccess.org' ||
    host === 'nmlsconsumeraccess.org' ||
    host.includes('nmlsconsumeraccess')
  );
}

function isPrimarySourceHost(host: string): boolean {
  if (isNmlsHost(host)) return true;
  if (host.endsWith('.gov') || host.endsWith('.gov.uk')) return true;
  if (
    host === 'www.consumerfinance.gov' ||
    host === 'consumerfinance.gov' ||
    host === 'www.hud.gov' ||
    host === 'hud.gov' ||
    host === 'www.floridahousing.org' ||
    host.includes('housing') && host.endsWith('.gov')
  ) {
    return true;
  }
  return false;
}

function specialistHub(
  host: string
): 'insurance' | 'move' | 'ask' | 'contractor' | null {
  if (host === 'www.insurancetrusthub.com' || host === 'insurancetrusthub.com') {
    return 'insurance';
  }
  if (host === 'www.movetrusthub.com' || host === 'movetrusthub.com') {
    return 'move';
  }
  if (host === 'www.asktrusthub.com' || host === 'asktrusthub.com') {
    return 'ask';
  }
  if (host === 'www.contractortrusthub.com' || host === 'contractortrusthub.com') {
    return 'contractor';
  }
  return null;
}

function classifyInternalPath(fromPath: string, toPath: string): string | null {
  const from = fromPath.toLowerCase();
  const to = toPath.toLowerCase();

  if (from.includes('/local-lenders') && to.startsWith('/lenders/')) {
    return 'hub_to_profile';
  }
  if (from.startsWith('/lenders/') && to.includes('nmls')) {
    return 'profile_to_verify';
  }
  if (from.includes('/calculators') && to.includes('/local-lenders')) {
    return 'tool_to_hub';
  }
  if (from.includes('/local-lenders/') && to.match(/\/local-lenders\/[^/]+$/)) {
    return 'county_to_state';
  }
  if (from.match(/\/local-lenders\/[^/]+$/) && to.includes('/local-lenders/')) {
    return 'state_to_county';
  }
  if (to.includes('/compare')) return 'path_to_compare';
  if (to.includes('/calculators')) return 'path_to_calculator';
  if (to.includes('/my-lending')) return 'path_to_my_lending';
  if (to.includes('/methodology')) return 'path_to_methodology';
  return null;
}

export function ResearchClickTracker() {
  useEffect(() => {
    const w = window as Window & {
      __LTH_MEASUREMENT_BASELINE?: string;
      __LTH_MEASUREMENT_LABEL?: string;
      __LTH_HUB?: string;
    };
    w.__LTH_MEASUREMENT_BASELINE = LENDER_MEASUREMENT_BASELINE_DATE;
    w.__LTH_MEASUREMENT_LABEL = LENDER_MEASUREMENT_BASELINE_LABEL;
    w.__LTH_HUB = 'lender';

    const onClick = (e: MouseEvent) => {
      const a = closestAnchor(e.target);
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

      const host = hostOf(href);
      const toPath = pathOf(href);
      const fromPath = window.location.pathname;
      const explicit = a.getAttribute('data-research-path');

      if (host && isNmlsHost(host)) {
        trackNmlsVerificationLookup({
          source: a.getAttribute('data-track-source') ?? 'link',
          path: fromPath,
        });
        return;
      }

      if (host && isPrimarySourceHost(host)) {
        trackOutboundPrimarySource({ host, kind: 'primary' });
      }

      if (host) {
        const hub = specialistHub(host);
        if (hub) {
          trackOutboundSpecialistHub({ hub, href });
        }
      }

      if (toPath && (href.startsWith('/') || host === window.location.hostname)) {
        const kind = explicit || classifyInternalPath(fromPath, toPath);
        if (kind) {
          trackResearchPathClick({ kind, from: fromPath, to: toPath });
        }
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
