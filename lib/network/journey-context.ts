/**
 * Stage A′ — Contextual Journey Handoffs (non-PII).
 * Shared contract for crawlable inter-hub research links.
 *
 * Example:
 *   ?src=move&journey=relocate&state=FL&county=miami-dade&intent=buy
 */

import { STATE_BY_CODE, STATE_BY_SLUG, US_STATES } from '@/lib/fdic/states';

export type JourneySrc = 'move' | 'lender' | 'insurance' | 'ask';
export type JourneyKind = 'relocate' | 'purchase' | 'refi' | 'coverage' | 'unknown';
export type JourneyIntent = 'buy' | 'rent' | 'refi' | 'unknown';
export type JourneyHousing = 'owner' | 'renter' | 'unknown';

export type JourneyContext = {
  src?: JourneySrc;
  journey?: JourneyKind;
  /** Canonical state slug e.g. florida */
  stateSlug?: string;
  /** 2-letter code e.g. FL */
  stateCode?: string;
  /** Full name e.g. Florida */
  stateName?: string;
  /** County/market slug e.g. miami-dade */
  county?: string;
  intent?: JourneyIntent;
  housing?: JourneyHousing;
};

export type JourneyStep = {
  hub: JourneySrc;
  href: string;
  title: string;
  body: string;
  cta: string;
  priority: 'primary' | 'secondary';
};

const HUB_ORIGIN = {
  move: 'https://www.movetrusthub.com',
  insurance: 'https://www.insurancetrusthub.com',
  lender: 'https://www.lendertrusthub.com',
  ask: 'https://www.asktrusthub.com',
} as const;

const SRC_SET = new Set<JourneySrc>(['move', 'lender', 'insurance', 'ask']);
const JOURNEY_SET = new Set<JourneyKind>([
  'relocate',
  'purchase',
  'refi',
  'coverage',
  'unknown',
]);
const INTENT_SET = new Set<JourneyIntent>(['buy', 'rent', 'refi', 'unknown']);
const HOUSING_SET = new Set<JourneyHousing>(['owner', 'renter', 'unknown']);

function firstParam(
  v: string | string[] | undefined | null
): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t || undefined;
}

function normalizeCountySlug(raw?: string): string | undefined {
  if (!raw) return undefined;
  const s = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return s || undefined;
}

/** Accept FL, florida, Florida → { slug, code, name } */
export function normalizeState(raw?: string): {
  stateSlug: string;
  stateCode: string;
  stateName: string;
} | null {
  if (!raw) return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.length === 2) {
    const meta = STATE_BY_CODE.get(t.toUpperCase());
    if (meta) {
      return { stateSlug: meta.slug, stateCode: meta.code, stateName: meta.fullName };
    }
  }
  const slug = t.toLowerCase().replace(/\s+/g, '-');
  const bySlug = STATE_BY_SLUG.get(slug);
  if (bySlug) {
    return {
      stateSlug: bySlug.slug,
      stateCode: bySlug.code,
      stateName: bySlug.fullName,
    };
  }
  const byName = US_STATES.find(
    (s) => s.fullName.toLowerCase() === t.toLowerCase()
  );
  if (byName) {
    return {
      stateSlug: byName.slug,
      stateCode: byName.code,
      stateName: byName.fullName,
    };
  }
  return null;
}

export function parseJourneyContext(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined
): JourneyContext {
  const get = (key: string): string | undefined => {
    if (!searchParams) return undefined;
    if (searchParams instanceof URLSearchParams) {
      return firstParam(searchParams.get(key));
    }
    return firstParam(searchParams[key]);
  };

  const srcRaw = get('src')?.toLowerCase() as JourneySrc | undefined;
  const journeyRaw = get('journey')?.toLowerCase() as JourneyKind | undefined;
  const intentRaw = get('intent')?.toLowerCase() as JourneyIntent | undefined;
  const housingRaw = get('housing')?.toLowerCase() as JourneyHousing | undefined;
  const stateRaw = get('state');
  const county = normalizeCountySlug(get('county'));
  const st = normalizeState(stateRaw);

  return {
    src: srcRaw && SRC_SET.has(srcRaw) ? srcRaw : undefined,
    journey: journeyRaw && JOURNEY_SET.has(journeyRaw) ? journeyRaw : undefined,
    intent: intentRaw && INTENT_SET.has(intentRaw) ? intentRaw : undefined,
    housing: housingRaw && HOUSING_SET.has(housingRaw) ? housingRaw : undefined,
    stateSlug: st?.stateSlug,
    stateCode: st?.stateCode,
    stateName: st?.stateName,
    county,
  };
}

/** Build query string without leading ? */
export function buildJourneyQuery(
  ctx: JourneyContext,
  extras?: Record<string, string | undefined>
): string {
  const p = new URLSearchParams();
  if (ctx.src) p.set('src', ctx.src);
  if (ctx.journey) p.set('journey', ctx.journey);
  // Prefer 2-letter state for compactness; receivers accept both
  if (ctx.stateCode) p.set('state', ctx.stateCode);
  else if (ctx.stateSlug) p.set('state', ctx.stateSlug);
  if (ctx.county) p.set('county', ctx.county);
  if (ctx.intent && ctx.intent !== 'unknown') p.set('intent', ctx.intent);
  if (ctx.housing && ctx.housing !== 'unknown') p.set('housing', ctx.housing);
  if (extras) {
    for (const [k, v] of Object.entries(extras)) {
      if (v) p.set(k, v);
    }
  }
  return p.toString();
}

export function withJourneyParams(path: string, ctx: JourneyContext): string {
  const q = buildJourneyQuery(ctx);
  if (!q) return path;
  return path.includes('?') ? `${path}&${q}` : `${path}?${q}`;
}

export function placeLabel(ctx: JourneyContext): string | null {
  if (ctx.county && ctx.stateName) {
    const countyName = ctx.county
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `${countyName} County, ${ctx.stateName}`;
  }
  if (ctx.stateName) return ctx.stateName;
  if (ctx.stateCode) return ctx.stateCode;
  return null;
}

/** Path on LenderTrustHub (absolute origin applied separately). */
export function resolveLenderLandingPath(ctx: JourneyContext): string {
  if (ctx.stateSlug && ctx.county) {
    return withJourneyParams(`/local-lenders/${ctx.stateSlug}/${ctx.county}`, {
      ...ctx,
      src: ctx.src ?? 'move',
    });
  }
  if (ctx.stateSlug) {
    return withJourneyParams(`/local-lenders/${ctx.stateSlug}`, {
      ...ctx,
      src: ctx.src ?? 'move',
    });
  }
  return withJourneyParams('/local-lenders', { ...ctx, src: ctx.src ?? 'move' });
}

/** Path on InsuranceTrustHub. */
export function resolveInsuranceLandingPath(ctx: JourneyContext): string {
  if (ctx.stateSlug) {
    // Prefer destination guide when state is known
    return withJourneyParams(`/destinations/${ctx.stateSlug}`, {
      ...ctx,
      src: ctx.src ?? 'lender',
    });
  }
  if (ctx.stateCode) {
    return withJourneyParams(`/directory?state=${ctx.stateCode}`, {
      ...ctx,
      src: ctx.src ?? 'lender',
    });
  }
  return withJourneyParams('/destinations', { ...ctx, src: ctx.src ?? 'lender' });
}

/** Path on MoveTrustHub (homepage with context until destination pages expand). */
export function resolveMoveLandingPath(ctx: JourneyContext): string {
  return withJourneyParams('/', { ...ctx, src: ctx.src ?? 'lender' });
}

export function absoluteHubUrl(
  hub: keyof typeof HUB_ORIGIN,
  pathWithQuery: string
): string {
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  return `${HUB_ORIGIN[hub]}${path}`;
}

export function buildLenderJourneyUrl(ctx: JourneyContext): string {
  return absoluteHubUrl('lender', resolveLenderLandingPath({ ...ctx }));
}

export function buildInsuranceJourneyUrl(ctx: JourneyContext): string {
  return absoluteHubUrl('insurance', resolveInsuranceLandingPath({ ...ctx }));
}

export function buildMoveJourneyUrl(ctx: JourneyContext): string {
  return absoluteHubUrl('move', resolveMoveLandingPath({ ...ctx }));
}

/**
 * Situation table (Stage A′).
 * Returns 0–2 steps excluding the current hub.
 */
export function resolveSituationSteps(
  ctx: JourneyContext,
  currentHub: JourneySrc
): JourneyStep[] {
  const place = placeLabel(ctx) ?? 'your destination';
  const intent = ctx.intent ?? 'unknown';
  const journey = ctx.journey ?? 'unknown';
  const isRelocate = journey === 'relocate' || ctx.src === 'move';
  const isBuy =
    intent === 'buy' ||
    journey === 'purchase' ||
    ctx.housing === 'owner' ||
    intent === 'refi' ||
    journey === 'refi';
  const isRent = intent === 'rent' || ctx.housing === 'renter';
  const isRefi = intent === 'refi' || journey === 'refi';

  const steps: JourneyStep[] = [];

  const lenderStep = (priority: 'primary' | 'secondary'): JourneyStep => ({
    hub: 'lender',
    href: buildLenderJourneyUrl({ ...ctx, src: currentHub === 'lender' ? ctx.src : currentHub }),
    title: isRelocate
      ? `Buying after your move to ${place}?`
      : `Research mortgages in ${place}`,
    body: isRelocate
      ? `Research mortgage activity, local lenders, and Loan Estimate tools for ${place}.`
      : `Explore NMLS-oriented lenders and educational Loan Estimate tools for ${place}.`,
    cta: 'Research local lenders',
    priority,
  });

  const insuranceStep = (priority: 'primary' | 'secondary'): JourneyStep => ({
    hub: 'insurance',
    href: buildInsuranceJourneyUrl({
      ...ctx,
      src: currentHub === 'insurance' ? ctx.src : currentHub,
    }),
    title: isRelocate
      ? 'Your move changes more than your address'
      : `Coverage research for ${place}`,
    body: isRent
      ? `Research renters and auto coverage considerations for ${place}.`
      : isBuy || !isRent
        ? `Homeowners insurance is typically required to close — research coverage considerations in ${place}.`
        : `Research coverage considerations for ${place}.`,
    cta: 'Research coverage',
    priority,
  });

  const moveStep = (priority: 'primary' | 'secondary'): JourneyStep => ({
    hub: 'move',
    href: buildMoveJourneyUrl({
      ...ctx,
      src: currentHub === 'move' ? ctx.src : currentHub,
    }),
    title: 'Research licensed movers',
    body: 'Compare interstate movers with public FMCSA context on Move Trust Hub.',
    cta: 'Research movers',
    priority,
  });

  // Situation routing
  if (isRefi && !isRelocate) {
    if (currentHub !== 'lender') steps.push(lenderStep('primary'));
  } else if (isRelocate && isBuy) {
    if (currentHub !== 'lender') steps.push(lenderStep('primary'));
    if (currentHub !== 'insurance') steps.push(insuranceStep('secondary'));
  } else if (isRelocate && isRent) {
    if (currentHub !== 'insurance') steps.push(insuranceStep('primary'));
  } else if (isRelocate && !isBuy && !isRent) {
    // Unknown intent: Insurance common, Lender secondary
    if (currentHub !== 'insurance') steps.push(insuranceStep('primary'));
    if (currentHub !== 'lender') steps.push(lenderStep('secondary'));
  } else if (isBuy && !isRelocate) {
    if (currentHub !== 'lender') steps.push(lenderStep('primary'));
    if (currentHub !== 'insurance') steps.push(insuranceStep('secondary'));
  } else if (currentHub === 'lender' && journey === 'coverage') {
    // Coverage-focused mortgage research → insurance next (purchase already implies isBuy above)
    steps.push(insuranceStep('primary'));
  } else if (currentHub === 'insurance') {
    if (isBuy) steps.push(lenderStep('primary'));
    else if (isRelocate) steps.push(moveStep('secondary'));
  }

  // Lender default: coverage is a common next step after mortgage research
  if (steps.length === 0 && currentHub === 'lender') {
    steps.push(insuranceStep('primary'));
  }

  // Cap at 2, drop same-hub
  return steps
    .filter((s) => s.hub !== currentHub)
    .slice(0, 2)
    .map((s, i) => ({
      ...s,
      priority: i === 0 ? 'primary' : 'secondary',
    }));
}

export function hasJourneyContext(ctx: JourneyContext): boolean {
  return Boolean(
    ctx.src ||
      ctx.journey ||
      ctx.stateSlug ||
      ctx.county ||
      (ctx.intent && ctx.intent !== 'unknown')
  );
}

export function orientationCopy(ctx: JourneyContext): {
  eyebrow: string;
  title: string;
  body: string;
} | null {
  if (!hasJourneyContext(ctx)) return null;
  const place = placeLabel(ctx);
  const fromMove = ctx.src === 'move' || ctx.journey === 'relocate';
  if (fromMove && place) {
    return {
      eyebrow: 'Your relocation research',
      title: `Moving to ${place}`,
      body:
        ctx.intent === 'buy'
          ? 'Continue with local mortgage research — market context, lenders, and Loan Estimate tools. Educational only.'
          : ctx.intent === 'rent'
            ? 'Continue with coverage research for your destination. Educational only — not a quote marketplace.'
            : 'Continue with local market research. Choose mortgage tools if you’re buying, or coverage research if you’re renting.',
    };
  }
  if (ctx.src === 'lender' && place) {
    return {
      eyebrow: 'Continued from mortgage research',
      title: `Coverage context for ${place}`,
      body: 'Homeowners insurance is typically required to close. Research considerations for your market — not a quote funnel.',
    };
  }
  if (ctx.src === 'insurance' && place) {
    return {
      eyebrow: 'Continued from coverage research',
      title: `Financing research for ${place}`,
      body: 'Explore NMLS-oriented lenders and educational Loan Estimate tools for this market.',
    };
  }
  if (place) {
    return {
      eyebrow: 'Research context',
      title: place,
      body: 'Context from another Trust Hub. Continue with the tools below — research only.',
    };
  }
  return {
    eyebrow: 'Network research',
    title: 'Continue your Trust journey',
    body: 'Context from another specialist hub. Explore the research modules below.',
  };
}
