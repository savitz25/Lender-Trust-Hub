/**
 * Map Ask context onto existing Lender routes. No second search engine.
 */

import type { LenderAskSearchContext, LenderHandoffEntityType } from './allowlist';
import {
  resolveLenderHandoffGeography,
  type LenderGeoMatchClass,
  type ResolvedLenderGeography,
} from './geography';
import { withLenderAskParams } from './parse';

export type LenderAskHandoffStatus = 'ok' | 'unsupported';

export type LenderAskHandoffResolution = {
  status: LenderAskHandoffStatus;
  path: string;
  href: string;
  entityType?: LenderHandoffEntityType;
  geography?: ResolvedLenderGeography;
  matchClass?: LenderGeoMatchClass;
  backLabel: string;
  bannerTitle: string;
  bannerBody: string;
  reason?: string;
};

function entityLabel(entity?: LenderHandoffEntityType): string {
  if (entity === 'mortgage_broker') return 'mortgage brokers';
  if (entity === 'bank') return 'banks';
  if (entity === 'mortgage_company') return 'mortgage companies';
  return 'lenders';
}

function placePhrase(geo?: ResolvedLenderGeography, ctx?: LenderAskSearchContext): string {
  if (ctx?.city && geo?.stateName) return `${ctx.city}, ${geo.stateName}`;
  if (geo?.city && geo.stateName) return `${geo.city}, ${geo.stateName}`;
  if (geo?.countyName && geo.stateName) return `${geo.countyName} County, ${geo.stateName}`;
  if (geo?.stateName) return geo.stateName;
  return 'your search';
}

function backLabel(ctx: LenderAskSearchContext, geo?: ResolvedLenderGeography): string {
  const who = entityLabel(ctx.entityType);
  if (ctx.category === 'fha' && (ctx.city || geo?.city)) {
    return `Back to FHA lenders around ${placePhrase(geo, ctx)}`;
  }
  if (ctx.category === 'va') {
    return `Back to VA lenders in ${geo?.stateName || ctx.state || 'this state'}`;
  }
  if (ctx.entityType === 'mortgage_broker') {
    return `Back to mortgage brokers in ${geo?.stateName || ctx.state || 'this state'}`;
  }
  if (ctx.entityType === 'mortgage_company' && geo?.stateName && !ctx.city && !ctx.county) {
    return `Back to mortgage companies in ${geo.stateName}`;
  }
  return `Back to ${who} in ${placePhrase(geo, ctx)}`;
}

function unsupported(
  ctx: LenderAskSearchContext,
  title: string,
  body: string,
  reason: string
): LenderAskHandoffResolution {
  const path = '/from-ask/unsupported';
  return {
    status: 'unsupported',
    path,
    href: withLenderAskParams(path, ctx),
    entityType: ctx.entityType,
    backLabel: 'Back to Ask search',
    bannerTitle: title,
    bannerBody: body,
    reason,
  };
}

export function resolveLenderAskHandoff(ctx: LenderAskSearchContext): LenderAskHandoffResolution {
  if (ctx.unsupportedEntity === 'loan_officer' || ctx.unsupportedEntity === 'loanofficer') {
    return unsupported(
      ctx,
      'Loan officers are not a searchable directory entity',
      'LenderTrustHub lists companies, brokers, and banks — not individual loan officers. This search was not converted into a mortgage-company listing.',
      'loan_officer_unsupported'
    );
  }
  if (ctx.unsupportedEntity) {
    return unsupported(
      ctx,
      'This lender type is not available here',
      'LenderTrustHub did not substitute a different provider type.',
      `unsupported_entity:${ctx.unsupportedEntity}`
    );
  }
  if (ctx.unsupportedCategory === 'refinance' || ctx.unsupportedCategory === 'refi') {
    return unsupported(
      ctx,
      'Refinance is not a source-backed lender category',
      'HMDA lender-level evidence on LenderTrustHub does not support a refinance filter. This search was not widened to all mortgage companies.',
      'refinance_unsupported'
    );
  }
  if (ctx.unsupportedCategory) {
    return unsupported(
      ctx,
      'This loan category is not source-backed',
      'Only conventional, FHA, VA, and USDA are treated as evidence-backed when HMDA originations are greater than zero. Jumbo, ARM, and refinance are not claimed from generic mortgage status.',
      `unsupported_category:${ctx.unsupportedCategory}`
    );
  }

  const geo = resolveLenderHandoffGeography(ctx);
  if (!geo) {
    return {
      status: 'ok',
      path: '/local-lenders',
      href: withLenderAskParams('/local-lenders', ctx),
      entityType: ctx.entityType,
      matchClass: 'physical_state',
      backLabel: 'Back to local lenders',
      bannerTitle: 'Mortgage lenders',
      bannerBody: 'Choose a state to browse existing LenderTrustHub directories.',
    };
  }

  const path = geo.countySlug
    ? `/local-lenders/${geo.stateSlug}/${geo.countySlug}`
    : `/local-lenders/${geo.stateSlug}`;

  const cat = ctx.category ? ctx.category.toUpperCase() : null;
  const titleBits = [
    cat,
    entityLabel(ctx.entityType),
    geo.cityCoveredByCountyOnly && geo.city
      ? `near ${geo.city}`
      : geo.countyName
        ? `in ${geo.countyName} County`
        : `in ${geo.stateName}`,
  ]
    .filter(Boolean)
    .join(' ');

  const body = geo.cityCoveredByCountyOnly
    ? `${geo.city || 'This city'} is in ${geo.countyName} County. Results use existing county listings and HMDA activity where present — not an exact ${geo.city} office graph. HMDA activity is not a license claim.`
    : `Results may qualify through physical location in ${geo.stateName} or HMDA activity in ${geo.stateName}. Those signals stay distinct. HMDA activity is not the same as being licensed in ${geo.stateName}.`;

  return {
    status: 'ok',
    path,
    href: withLenderAskParams(path, ctx),
    entityType: ctx.entityType,
    geography: geo,
    matchClass: geo.matchClass,
    backLabel: backLabel(ctx, geo),
    bannerTitle: titleBits.charAt(0).toUpperCase() + titleBits.slice(1),
    bannerBody: body,
  };
}

export function isResolvedLenderAskPath(
  pathname: string,
  resolution: LenderAskHandoffResolution
): boolean {
  const current = pathname.replace(/\/$/, '') || '/';
  const target = resolution.path.replace(/\/$/, '') || '/';
  if (current === target) return true;
  if (current.startsWith('/lenders/')) return true;
  return false;
}

export function shouldRedirectLenderAskEntry(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return (
    p === '/' ||
    p === '/from-ask' ||
    p === '/local-lenders' ||
    /^\/local-lenders\/[^/]+$/.test(p)
  );
}
